import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  SearchCheck,
  BadgeCheck,
  Wrench,
  DoorOpen,
  CreditCard,
  FileText,
  Gift,
  CalendarDays,
  BookOpen,
  Boxes,
  IdCard,
  HardHat,
  Ticket,
  Megaphone,
  MessageSquareText,
  MessagesSquare,
  FolderOpen,
  CalendarClock,
  History,
  UserCog,
  Building2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { ResourceKey } from "@/lib/rbac/keys";

export interface NavItem {
  labelKey: DictKey;
  href: string;
  icon: LucideIcon;
  policy: ResourceKey;
  /** false = module planned but not built yet (rendered disabled) */
  ready: boolean;
}

export interface NavGroup {
  labelKey: DictKey;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.group.operations",
    items: [
      { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, policy: "DASHBOARD", ready: true },
      { labelKey: "nav.customers", href: "/customers", icon: Users, policy: "CUSTOMERS", ready: true },
      { labelKey: "nav.vehicles", href: "/vehicles", icon: Car, policy: "VEHICLES", ready: true },
      { labelKey: "nav.jobOrders", href: "/job-orders", icon: ClipboardList, policy: "JOB_ORDERS", ready: true },
      { labelKey: "nav.inspections", href: "/inspections", icon: SearchCheck, policy: "INSPECTIONS", ready: true },
      { labelKey: "nav.qualityCheck", href: "/quality-check", icon: BadgeCheck, policy: "QUALITY_CHECK", ready: true },
      { labelKey: "nav.serviceExecution", href: "/service-execution", icon: Wrench, policy: "SERVICE_EXECUTION", ready: true },
      { labelKey: "nav.exitPermits", href: "/exit-permits", icon: DoorOpen, policy: "EXIT_PERMITS", ready: true },
    ],
  },
  {
    labelKey: "nav.group.finance",
    items: [
      { labelKey: "nav.payments", href: "/payments", icon: CreditCard, policy: "PAYMENTS", ready: true },
      { labelKey: "nav.quotations", href: "/quotations", icon: FileText, policy: "QUOTATIONS", ready: true },
      { labelKey: "nav.vouchers", href: "/vouchers", icon: Gift, policy: "VOUCHERS", ready: true },
      { labelKey: "nav.dailyReport", href: "/daily-report", icon: CalendarDays, policy: "DAILY_REPORT", ready: true },
    ],
  },
  {
    labelKey: "nav.group.catalog",
    items: [
      { labelKey: "nav.serviceCatalog", href: "/service-catalog", icon: BookOpen, policy: "SERVICE_CATALOG", ready: true },
      { labelKey: "nav.inventory", href: "/inventory", icon: Boxes, policy: "INVENTORY", ready: true },
      { labelKey: "nav.employees", href: "/employees", icon: IdCard, policy: "EMPLOYEES", ready: true },
      { labelKey: "nav.technicians", href: "/technicians", icon: HardHat, policy: "TECHNICIANS", ready: true },
    ],
  },
  {
    labelKey: "nav.group.communication",
    items: [
      { labelKey: "nav.tickets", href: "/tickets", icon: Ticket, policy: "TICKETS", ready: false },
      { labelKey: "nav.campaigns", href: "/campaigns", icon: Megaphone, policy: "CAMPAIGNS", ready: false },
      { labelKey: "nav.sms", href: "/sms", icon: MessageSquareText, policy: "SMS", ready: false },
      { labelKey: "nav.chat", href: "/chat", icon: MessagesSquare, policy: "INTERNAL_CHAT", ready: false },
      { labelKey: "nav.drive", href: "/drive", icon: FolderOpen, policy: "DRIVE", ready: false },
      { labelKey: "nav.scheduledReports", href: "/scheduled-reports", icon: CalendarClock, policy: "SCHEDULED_REPORTS", ready: false },
    ],
  },
  {
    labelKey: "nav.group.admin",
    items: [
      { labelKey: "nav.activityLog", href: "/activity", icon: History, policy: "ACTIVITY_LOG", ready: true },
      { labelKey: "nav.users", href: "/admin/users", icon: UserCog, policy: "USERS_ADMIN", ready: true },
      { labelKey: "nav.departments", href: "/admin/departments", icon: Building2, policy: "DEPARTMENTS_ADMIN", ready: true },
      { labelKey: "nav.roles", href: "/admin/roles", icon: ShieldCheck, policy: "ROLES_POLICIES_ADMIN", ready: true },
    ],
  },
];
