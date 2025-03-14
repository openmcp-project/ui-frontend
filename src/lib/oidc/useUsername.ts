import { useAuth } from "react-oidc-context";

// returns the user.profile.sub (subject as in email) of the currently logged in user
export function useAuthSubject(){
    const auth = useAuth();
    return auth.user?.profile?.sub;
}