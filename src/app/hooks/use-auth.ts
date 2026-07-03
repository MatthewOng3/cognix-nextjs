import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseClient } from "@/app/lib/util/supabase/client";

// Cache the session to prevent multiple checks
let cachedSession: { user: User | null } | null = null;
let isInitialized = false;

/**
 * @description Custom hook to handle authentication state.
 * @returns The user object, user ID, loading state, and authentication status
 */
export function useAuth() {
	const [user, setUser] = useState<User | null>(cachedSession?.user ?? null);
	const [loading, setLoading] = useState(!isInitialized);
	const supabase = createSupabaseClient();

	/**
	 * Sync the Realtime connection with the current session token
	 */
	const setRealtimeAuth = useCallback((session: Session | null) => {
		if (session?.access_token) {
			console.log("Real time Auth Set");
			supabase.realtime.setAuth(session.access_token);
		} else {
			supabase.realtime.setAuth(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
		}
	}, [supabase.realtime]);
	
	/**
	 * @description Get Session only reruns
	 */
	const getSession = useCallback(async () => {
		if (cachedSession) {
			setUser(cachedSession.user);
			setLoading(false);
			return;
		}

		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			cachedSession = { user: session?.user ?? null };
 
			setUser(session?.user ?? null);
			// 👇 Tell Realtime to use this session’s JWT
			setRealtimeAuth(session);
		} catch (error) {
			console.error("Error getting session:", error);
		} finally {
			setLoading(false);
			isInitialized = true;
		}
	}, [supabase.auth, setRealtimeAuth]);

	useEffect(() => {
		getSession();

		const {
		data: { subscription },
		} = supabase.auth.onAuthStateChange(
		async (event: AuthChangeEvent, session: Session | null) => {
			cachedSession = { user: session?.user ?? null };
			setUser(session?.user ?? null);
		},
		);

		return () => subscription.unsubscribe();
	}, [supabase.auth, getSession]);

	return {
		user,
		userId: user?.id,
		loading,
		isAuthenticated: !!user,
	};
}
