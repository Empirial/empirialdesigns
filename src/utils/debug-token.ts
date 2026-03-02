import { supabase } from "@/integrations/supabase/client";

export async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        console.log('Your access token:', session.access_token);
        return session.access_token;
    } else {
        console.log('No active session found. Please log in first.');
        return null;
    }
}