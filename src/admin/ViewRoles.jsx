  import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import API_BASE_URL from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Edit2, Trash2, X, Check,
  ChevronDown, ChevronUp, Search, AlertTriangle, Info, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";


const groupPermissions = (permissions) => {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {});
};

const formatPermissions = (permissions) => {
  return permissions.map((perm) => {
    if (typeof perm === "object" && perm.key) {
      return perm;
    }
    const parts     = perm.split("_");
    const action    = parts[0];
    const restParts = parts.slice(1);
    const label = `${action.charAt(0).toUpperCase() + action.slice(1)} ${restParts.join(" ")}`;
    const group = restParts
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { key: perm, label, group };
  });
};

const getRoleInitial = (name) => name?.charAt(0)?.toUpperCase() || "R";

// ─── Permission Tag ────────────────────────────────────────────────────────────
const PermTag = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
    {label}
  </span>
);

// ─── Permission Toggle ─────────────────────────────────────────────────────────
const PermToggle = ({ perm, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div
      onClick={() => onChange(perm.key)}
      className={`w-4 h-4 rounded flex items-center justify-center border transition-all
        ${checked
          ? "bg-green-500 border-green-500"
          : "border-gray-300 bg-white group-hover:border-green-400"
        }`}
    >
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>
    <span className="text-[12px] text-gray-600 group-hover:text-gray-900 transition">
      {perm.label}
    </span>
  </label>
);

// ─── Role Modal (Create / Edit) ────────────────────────────────────────────────
const RoleModal = ({ role, onClose, onSave, allPermissions }) => {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [color, setColor] = useState(role?.color || "#22c55e");
  const [selectedPerms, setSelectedPerms] = useState(new Set(role?.permissions || []));
  const [saving, setSaving] = useState(false);
  const groupedPermissions = groupPermissions(allPermissions);
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(groupedPermissions));

  const togglePerm = (perm) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const groupPerms  = groupedPermissions[group];
    const allChecked  = groupPerms.every((p) => selectedPerms.has(p.key));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        groupPerms.forEach((p) => next.delete(p.key));
      } else {
        groupPerms.forEach((p) => next.add(p.key));
      }
      return next;
    });
  };

  const toggleGroupExpand = (group) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const selectAll = () => setSelectedPerms(new Set(allPermissions.map((p) => p.key)));
  const clearAll  = () => setSelectedPerms(new Set());

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    if (selectedPerms.size === 0) { toast.error("Select at least one permission"); return; }
    setSaving(true);
    await onSave({
      id:          role?._id,
      name:        name.trim(),
      description: description.trim(),
      permissions: Array.from(selectedPerms),
      color,
    });
    setSaving(false);
  };

  const COLORS = ["#22c55e","#16a34a","#3b82f6","#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316","#f59e0b"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50 border border-green-200">
              <Shield size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">{isEdit ? "Edit Role" : "Create New Role"}</h2>
              <p className="text-[11px] text-gray-400">Define permissions for this role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Content Editor"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Role Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Permissions <span className="text-green-600 ml-1">({selectedPerms.size} selected)</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[11px] text-green-600 hover:text-green-700 font-medium transition">Select All</button>
                <span className="text-gray-300">·</span>
                <button onClick={clearAll} className="text-[11px] text-gray-400 hover:text-gray-600 transition">Clear All</button>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(groupedPermissions).map(([group, perms]) => {
                const allChecked  = perms.every((p) => selectedPerms.has(p.key));
                const someChecked = perms.some((p)  => selectedPerms.has(p.key));
                const expanded    = expandedGroups.includes(group);

                return (
                  <div key={group} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => toggleGroupExpand(group)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer
                            ${allChecked ? "bg-green-500 border-green-500" : someChecked ? "bg-green-200 border-green-400" : "border-gray-300 bg-white"}`}
                        >
                          {allChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                          {!allChecked && someChecked && <div className="w-1.5 h-1.5 bg-green-600 rounded-sm" />}
                        </div>
                        <span className="text-[12px] font-semibold text-gray-700">{group}</span>
                        <span className="text-[10px] text-gray-400">
                          {perms.filter((p) => selectedPerms.has(p.key)).length}/{perms.length}
                        </span>
                      </div>
                      {expanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-3 grid grid-cols-2 gap-2 bg-white">
                            {perms.map((perm) => (
                              <PermToggle key={perm.key} perm={perm} checked={selectedPerms.has(perm.key)} onChange={togglePerm} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-green-500 hover:bg-green-600 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ role, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Role</h3>
            <p className="text-[13px] text-gray-500">
              Are you sure you want to delete <span className="text-gray-900 font-semibold">{role?.name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">Cancel</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main ViewRoles Component ──────────────────────────────────────────────────
const ViewRoles = () => {
  const { hasPermission } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedRole, setExpandedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = localStorage.getItem("adminToken");

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allRoles = data.roles
          || [...(data.systemRoles || []), ...(data.customRoles || [])];
        setRoles(allRoles);
        const formatted = formatPermissions(data.allPermissions || []);
        setAllPermissions(formatted);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleCreate = async (roleData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(roleData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to create role"); return; }
      toast.success("Role created successfully");
      setShowModal(false);
      fetchRoles();
    } catch {
      toast.error("Server error");
    }
  };

  const handleEdit = async (roleData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles/${roleData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(roleData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to update role"); return; }
      toast.success("Role updated successfully");
      setEditRole(null);
      fetchRoles();
    } catch {
      toast.error("Server error");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to delete role"); return; }
      toast.success("Role deleted");
      setDeleteTarget(null);
      fetchRoles();
    } catch {
      toast.error("Server error");
    }
  };

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedPermissions = groupPermissions(allPermissions);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-400 text-[13px] mt-0.5">
            Manage access control for your team · {roles.length} roles total
          </p>
        </div>
        {hasPermission("create_roles") && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-green-500 hover:bg-green-600 transition shadow-sm"
          >
            <Plus size={15} />
            Add Role
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {filtered.map((role, idx) => {
          const color    = role.color || "#22c55e";
          const expanded = expandedRole === role._id;
          const permCount = role.permissions?.length || 0;

          return (
            <motion.div
              key={role._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black flex-shrink-0"
                  style={{ backgroundColor: color + "18", border: `1px solid ${color}40`, color }}
                >
                  {getRoleInitial(role.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-gray-900">{role.name}</span>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {role.description || `${permCount} permission${permCount !== 1 ? "s" : ""} assigned`}
                  </p>
                </div>

                {/* Perm count */}
                <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-gray-400">
                  <Shield size={12} style={{ color }} />
                  <span>{permCount} permissions</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedRole(expanded ? null : role._id)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {hasPermission("edit_roles") && (
                    <button
                      onClick={() => setEditRole(role)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {hasPermission("delete_roles") && (
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded permissions */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 border-t border-gray-100 pt-4 bg-gray-50">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Assigned Permissions
                      </p>
                      {Object.entries(groupedPermissions).map(([group, perms]) => {
                        const assigned = perms.filter((p) =>
                          role.permissions?.includes(p.key)
                        );
                        if (assigned.length === 0) return null;
                        return (
                          <div key={group} className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 mb-1.5">{group}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {assigned.map((p) => (
                                <PermTag key={p.key} label={p.label} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Shield size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-[13px]">No roles found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <RoleModal onClose={() => setShowModal(false)} onSave={handleCreate} allPermissions={allPermissions} />
        )}
        {editRole && (
          <RoleModal role={editRole} onClose={() => setEditRole(null)} onSave={handleEdit} allPermissions={allPermissions} />
        )}
        {deleteTarget && (
          <DeleteModal role={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewRoles;