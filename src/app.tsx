import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import OverviewPage from "@/pages/OverviewPage/OverviewPage";
import RecordsPage from "@/pages/RecordsPage/RecordsPage";
import BudgetPage from "@/pages/BudgetPage/BudgetPage";
import ProgressPage from "@/pages/ProgressPage/ProgressPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="progress" element={<ProgressPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
