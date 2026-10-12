import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import { RedirectIfAuthed, RequireAuth } from "./auth/guards";
import AuthLayout from "./layouts/AuthLayout";
import DriveLayout from "./layouts/DriveLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { MyDrivePage, RecentPage, SearchPage, SharedPage, StarredPage, TrashPage } from "./pages/DrivePages";
import FilePreviewPage from "./pages/FilePreviewPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/drive" replace />} />

          <Route element={<RedirectIfAuthed />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<DriveLayout />}>
              <Route path="/drive" element={<MyDrivePage />} />
              <Route path="/shared" element={<SharedPage />} />
              <Route path="/recent" element={<RecentPage />} />
              <Route path="/starred" element={<StarredPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/file/:id" element={<FilePreviewPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
