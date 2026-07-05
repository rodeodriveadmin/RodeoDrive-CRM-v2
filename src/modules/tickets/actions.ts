"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "./constants";

function revalidate(id?: string) {
  revalidatePath("/tickets");
  if (id) revalidatePath(`/tickets/${id}`);
}

export interface TicketInput {
  title: string;
  description?: string;
  customerId?: string;
  priority: string;
  assignedTo?: string;
}

export async function createTicket(input: TicketInput): Promise<ActionResult> {
  const actor = await requirePolicy("TICKETS", "create");
  const title = input.title.trim();
  if (!title) return { error: "INVALID_INPUT" };

  let customerName: string | null = null;
  if (input.customerId) {
    const [c] = await db
      .select({ firstName: schema.customers.firstName, lastName: schema.customers.lastName })
      .from(schema.customers)
      .where(eq(schema.customers.id, input.customerId));
    if (c) customerName = `${c.firstName} ${c.lastName}`;
  }

  const [row] = await db
    .insert(schema.tickets)
    .values({
      title,
      description: input.description?.trim() || null,
      customerId: input.customerId || null,
      customerName,
      priority: (TICKET_PRIORITIES as readonly string[]).includes(input.priority)
        ? input.priority
        : "MEDIUM",
      assignedTo: input.assignedTo?.trim() || null,
      createdBy: actor.email,
    })
    .returning();

  await logActivity({
    entityType: "ticket",
    entityId: row.id,
    action: "create",
    message: `Ticket "${title}" created`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(row.id);
  return { ok: true, id: row.id };
}

export async function updateTicket(
  id: string,
  input: TicketInput & { status: string }
): Promise<ActionResult> {
  const actor = await requirePolicy("TICKETS", "update");
  const title = input.title.trim();
  if (!title) return { error: "INVALID_INPUT" };

  await db
    .update(schema.tickets)
    .set({
      title,
      description: input.description?.trim() || null,
      priority: (TICKET_PRIORITIES as readonly string[]).includes(input.priority)
        ? input.priority
        : "MEDIUM",
      status: (TICKET_STATUSES as readonly string[]).includes(input.status)
        ? input.status
        : "OPEN",
      assignedTo: input.assignedTo?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.tickets.id, id));

  await logActivity({
    entityType: "ticket",
    entityId: id,
    action: "update",
    message: `Ticket "${title}" updated`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(id);
  return { ok: true };
}

export async function setTicketStatus(id: string, status: string): Promise<ActionResult> {
  const actor = await requirePolicy("TICKETS", "update");
  if (!(TICKET_STATUSES as readonly string[]).includes(status)) return { error: "INVALID_INPUT" };
  await db
    .update(schema.tickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.tickets.id, id));
  await logActivity({
    entityType: "ticket",
    entityId: id,
    action: "update",
    message: `Ticket status → ${status}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate(id);
  return { ok: true };
}

export async function deleteTicket(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("TICKETS", "delete");
  await db.delete(schema.tickets).where(eq(schema.tickets.id, id));
  await logActivity({
    entityType: "ticket",
    entityId: id,
    action: "delete",
    message: "Ticket deleted",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidate();
  return { ok: true };
}

export async function addTicketComment(ticketId: string, body: string): Promise<ActionResult> {
  const actor = await requirePolicy("TICKETS", "update");
  const text = body.trim();
  if (!text) return { error: "INVALID_INPUT" };

  await db.insert(schema.ticketComments).values({
    ticketId,
    body: text,
    authorEmail: actor.email,
    authorName: actor.name,
  });
  await db
    .update(schema.tickets)
    .set({ updatedAt: new Date() })
    .where(eq(schema.tickets.id, ticketId));
  revalidate(ticketId);
  return { ok: true };
}
