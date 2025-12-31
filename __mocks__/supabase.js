export const supabase = {
  auth: {
    getUser: jest.fn(() => ({ data: { user: null } })),
  },
};