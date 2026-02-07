export const routes = {
  dashboard: "/",
  login: "/login",
  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    customers: "/admin/customers",
    subscriptions: "/admin/subscriptions",
    domains: "/admin/domains",
    hosting: "/admin/hosting",
    proposals: "/admin/proposals",
    tasks: "/admin/tasks",
    finance: "/admin/finance",
    reports: "/admin/reports",
    users: "/admin/users",
    settings: {
      webhooks: "/admin/settings/webhooks",
    },
  },
  portal: {
    root: "/portal",
    dashboard: "/portal/dashboard",
    subscriptions: "/portal/subscriptions",
    domains: "/portal/domains",
    hosting: "/portal/hosting",
    tickets: "/portal/tickets",
    profile: "/portal/profile",
    proposals: "/portal/proposals",
  },
  customers: {
    list: "/customers",
    add: "/customers/add",
    detail: (id: string) => `/customers/${id}`,
    edit: (id: string) => `/customers/${id}/edit`,
  },
  users: {
    list: "/users",
    add: "/users/add",
    edit: (id: string) => `/users/${id}/edit`,
  },
} as const

export type Routes = typeof routes