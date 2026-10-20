import { createContext, useContext } from "react";
import type { Session, User} from '../lib/types'

export interface RegisterInput {
    name: string
    email: string
    password: string
}

export interface AuthContextValue {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (input: RegisterInput) => Promise<void>
    logout: () => Promise<void>
    updateUser: (user: User) => void
    refreshUser: () => Promise<void>
    applySession: (session: Session) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)


export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
        return ctx
}