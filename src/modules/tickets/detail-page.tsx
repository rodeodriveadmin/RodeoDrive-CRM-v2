import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { TicketDetailView } from "./detail-view";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePolicy("TICKETS", "read");
  const { id } = await params;

  const [ticket] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
  const comments = ticket
    ? await db
        .select()
        .from(schema.ticketComments)
        .where(eq(schema.ticketComments.ticketId, id))
        .orderBy(asc(schema.ticketComments.createdAt))
    : [];

  return (
    <TicketDetailView
      ticket={
        ticket
          ? {
              id: ticket.id,
              title: ticket.title,
              description: ticket.description,
              customerId: ticket.customerId,
              customerName: ticket.customerName,
              status: ticket.status,
              priority: ticket.priority,
              assignedTo: ticket.assignedTo,
              createdBy: ticket.createdBy,
              createdAt: ticket.createdAt.toISOString(),
            }
          : null
      }
      comments={comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
