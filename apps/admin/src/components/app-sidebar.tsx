import { GalleryVerticalEnd } from 'lucide-react'

import { adminNavGroups } from '#/components/layout/nav-items'
import { NavMain } from '#/components/nav-main'
import { NavUser } from '#/components/nav-user'
import { TeamSwitcher } from '#/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '#/components/ui/sidebar'
import { useAdminAuth } from '#/context/admin-auth-provider'

const data = {
  user: {
    name: 'ادمین پلتفرم',
    email: 'owner@saluna.ir',
    avatar: '',
  },
  teams: [
    {
      name: 'ادمین سالونا',
      logo: GalleryVerticalEnd,
      plan: 'عملیات داخلی',
    },
  ],
  navMain: adminNavGroups,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { me } = useAdminAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: me.name || data.user.name,
            email: me.email || me.phoneNumber || me.username || data.user.email,
            avatar: '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
