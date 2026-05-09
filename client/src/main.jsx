import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./state/auth.jsx";
import "./styles.css";

const root = document.getElementById("root");
const queryClient = new QueryClient();

createRoot(root).render(
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
			<App />
		</AuthProvider>
	</QueryClientProvider>
);
