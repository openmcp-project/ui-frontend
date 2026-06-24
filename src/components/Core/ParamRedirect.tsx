import { Navigate, useParams } from 'react-router-dom';

interface ParamRedirectProps {
  to: (params: Record<string, string>) => string;
}

export function ParamRedirect({ to }: ParamRedirectProps) {
  const params = useParams();
  return <Navigate to={to(params as Record<string, string>)} replace />;
}
