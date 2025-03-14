import { useNavigate } from "react-router-dom";

export default function useLuigiNavigate() {
  const navigate = useNavigate();
  return navigate;
}
