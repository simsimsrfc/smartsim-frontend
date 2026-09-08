import { HistoryClient } from "./HistoryClient";
import { api, type HistoryApiItem } from "@/lib/api";

export const metadata = { title: "Historique — Smart Sim" };

export default async function HistoryPage() {
  let items: HistoryApiItem[] = [];

  try {
    const data = await api.history();
    items = data.items;
  } catch {
    items = [];
  }

  return <HistoryClient items={items} />;
}
