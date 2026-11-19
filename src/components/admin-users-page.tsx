"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getParse } from "@/lib/parse/client";
import { useI18n } from "@/lib/i18n";
import { AdminPageBar } from "@/components/header-parts";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
};

const ROLES = ["admin", "customer", "expert", "provider"];
const STATUSES = ["active", "pending", "suspended"];
const token = () => getParse().User.current()?.getSessionToken() ?? "";

export function AdminUsersPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState("");

  useEffect(() => {
    const user = getParse().User.current();
    if (!user) return router.replace(`/${locale}/sign-in`);
    if (user.get("role") !== "admin") return router.replace(`/${locale}/dashboard`);
    setCurrentId(user.id ?? "");
  }, [locale, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (roleFilter) params.set("role", roleFilter);
      setLoading(true);
      fetch(`/api/admin/users?${params.toString()}`, { headers: { Authorization: `Bearer ${token()}` } })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load failed"))))
        .then((data: AdminUser[]) => setUsers(data))
        .catch(() => setNotice("Could not load users. Please refresh the page."))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, roleFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { admin: 0, customer: 0, expert: 0, provider: 0 };
    users.forEach((user) => {
      result[user.role] = (result[user.role] ?? 0) + 1;
    });
    return result;
  }, [users]);

  async function update(user: AdminUser, changes: { role?: string; status?: string }) {
    setBusy(user.id);
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...changes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Update failed");
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, ...changes } : item)));
      setNotice("User updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The change could not be saved.");
    } finally {
      setBusy("");
    }
  }

  const selectClass = "ui-field !w-auto text-sm disabled:opacity-50";

  return (
    <main className="network-surface min-h-screen py-10">
      <section className="section max-w-6xl">
        <AdminPageBar />
        <p className="mt-8 text-xs font-bold uppercase tracking-brand text-[#638260]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">User management</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Search accounts, change roles and suspend or reactivate access. You cannot suspend or demote your own account.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => (
            <div key={role} className="network-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{role}</p>
              <p className="mt-1 text-2xl font-semibold text-[#40533d]">{counts[role] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            aria-label="Search users"
            placeholder="Search by name, email or username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ui-field flex-1 text-sm"
          />
          <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {notice && <p role="status" className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <div className="network-card mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rule bg-panel-head text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-500">Loading users…</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-500">No users match your search.</td></tr>
              )}
              {users.map((user) => {
                const isSelf = user.id === currentId;
                return (
                  <tr key={user.id} className="border-b border-neutral-100 last:border-0 hover:bg-[#f6f8f5]/60">
                    <td className="px-5 py-3 font-semibold text-neutral-900">{user.name || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <select
                        aria-label={`Role for ${user.email}`}
                        value={user.role}
                        disabled={busy === user.id || isSelf}
                        onChange={(e) => update(user, { role: e.target.value })}
                        className={selectClass}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        aria-label={`Status for ${user.email}`}
                        value={user.status}
                        disabled={busy === user.id || isSelf}
                        onChange={(e) => update(user, { status: e.target.value })}
                        className={selectClass}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
