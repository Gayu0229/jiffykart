
// Supabase is no longer used in this application. 
// All data is managed locally for the demo.
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: new Error('Local demo mode') }),
    signUp: async () => ({ data: {}, error: new Error('Local demo mode') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }), single: async () => ({ data: null, error: null }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    upsert: () => ({ select: async () => ({ data: null, error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) })
  })
} as any;
