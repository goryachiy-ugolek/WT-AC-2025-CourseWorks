import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import PostPage from "./pages/PostPage";
import LoginPage from "./pages/LoginPage";
import EditorPage from "./pages/EditorPage";
import DraftsPage from "./pages/DraftsPage";
import TagManagementPage from "./pages/TagManagementPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import Layout from "./components/Layout";

const App: React.FC = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<FeedPage />} /> {/* + */}
        <Route path="/post/:id" element={<PostPage />} /> {/* + */}
        <Route path="/login" element={<LoginPage />} /> {/* + */}
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/drafts" element={<DraftsPage />} /> {/* + */}
        <Route path="/tags" element={<TagManagementPage />} /> {/* + */}
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  </Router>
);

export default App;
