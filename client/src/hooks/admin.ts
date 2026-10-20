import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AdminStats, AdminUserDetail, AdminUserList, Role, User, UserStatus } from '../lib/types'

export const PAGE_SIZE = 10

export interface UserFilters {
  page: number
  search: string
  role: Role | ''
  status: UserStatus | ''
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'] as const,
    queryFn: () => api<AdminStats>('/admin/stats'),
  })
}

export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', filters] as const,
    queryFn: () => {
      // Only send the filters that are actually set
      const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE) })
      if (filters.search) params.set('search', filters.search)
      if (filters.role) params.set('role', filters.role)
      if (filters.status) params.set('status', filters.status)
      return api<AdminUserList>(`/admin/users?${params}`)
    },
    placeholderData: keepPreviousData, // keep showing the current page while the next one loads
  })
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'user', id] as const,
    queryFn: () => api<AdminUserDetail>(`/admin/users/${id}`),
    enabled: id !== null,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...changes }: { id: string; role?: Role; status?: UserStatus }) =>
      api<{ user: User }>(`/admin/users/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/admin/users/${id}`, { method: 'DELETE' }),
    // Not the detail query: that user no longer exists
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
      ]),
  })
}