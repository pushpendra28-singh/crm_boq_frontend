import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import API_BASE_URL from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  AlertTriangle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Crown,
  RefreshCw,
  Filter,
  MoreVertical,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Role badge config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  superadmin:      { label: "Super Admin",      color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500" },
  admin:           { label: "Admin",            color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",  dot: "bg-orange-500" },
  manager:         { label: "Manager",          color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  dot: "bg-violet-500" },
  hr:              { label: "HR",               color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-200",    dot: "bg-cyan-500" },
  sales:           { label: "Sales",            color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  project_manager: { label: "Project Manager",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500" },
  employee:        { label: "Employee",         color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  dot: "bg-indigo-500" },
};

const getRoleInfo = (role) =>
  ROLE_CONFIG[role] || { label: role || "Unknown", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200", dot: "bg-gray-400" };

const getInitials = (name) =>
  name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-500",
];

const getGradient = (str) => {
  let hash = 0;
  for (let i = 0; i < (str?.length || 0); i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

// ─── Input field ─────────────────────────────────────────────────────────────
const FormField = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      {children}
    </div>
    {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
  </div>
);

const inputCls = (hasIcon, error) =>
  `w-full bg-gray-50 border ${error ? "border-red-300" : "border-gray-200"} rounded-xl ${hasIcon ? "pl-9" : "pl-3.5"} pr-3.5 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition`;

// ─── Role Select ──────────────────────────────────────────────────────────────
const RoleSelect = ({ value, onChange, roles, disabled }) => {
  const [open, setOpen] = useState(false);

  const allOptions = (roles || [])
    .filter(Boolean)
    .map((r) => ({
      value: String(r.slug || r.role || r.value || "").trim(),
      label: String(r.name || r.label || r.role || "").trim(),
    }))
    .filter((r) => r.value);

  const normalizedValue = String(value || "").trim().toLowerCase();

  const currentRole = allOptions.find(
    (r) => String(r.value || "").trim().toLowerCase() === normalizedValue
  );

  const roleInfo = getRoleInfo(value) || {
    label: currentRole?.label || value,
    color: "text-gray-700",
    dot: "bg-gray-400",
  };

  const unique = allOptions.filter(
    (opt, idx, self) => self.findIndex((o) => o.value === opt.value) === idx
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-emerald-400 transition ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${roleInfo.dot}`} />
          <span className={roleInfo.color}>{roleInfo.label}</span>
        </div>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
          >
            {unique.map((opt) => {
              const ri = getRoleInfo(opt.value);
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-[13px] transition hover:bg-gray-50 ${selected ? "bg-gray-100" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ri.dot}`} />
                  <span className={ri.color}>{opt.label}</span>
                  {selected && <Check size={12} className="ml-auto text-emerald-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── User Modal (Create / Edit) ───────────────────────────────────────────────
const UserModal = ({ user, onClose, onSave, customRoles }) => {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "employee",
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const val = typeof e === "string" ? e : e.target.value;
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!isEdit && !form.password.trim()) errs.password = "Password is required";
    if (!isEdit && form.password.length < 6) errs.password = "Minimum 6 characters";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (!isEdit || form.password) payload.password = form.password;
    await onSave(payload, user?._id);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <UserCog size={15} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">{isEdit ? "Edit User" : "Create New User"}</h2>
              <p className="text-[11px] text-gray-400">{isEdit ? "Update user details & role" : "Add a new team member"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <FormField label="Full Name" icon={User} error={errors.name}>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="John Doe"
              className={inputCls(true, errors.name)}
            />
          </FormField>

          <FormField label="Email Address" icon={Mail} error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="john@example.com"
              className={inputCls(true, errors.email)}
            />
          </FormField>

          <FormField label={isEdit ? "New Password (leave blank to keep)" : "Password"} icon={Lock} error={errors.password}>
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder={isEdit ? "Leave blank to keep current" : "Min. 6 characters"}
              className={`${inputCls(true, errors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </FormField>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <RoleSelect value={form.role} onChange={set("role")} roles={customRoles} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800 mb-1">Delete User</h3>
            <p className="text-[13px] text-gray-500">
              Are you sure you want to permanently delete{" "}
              <span className="text-gray-800 font-semibold">{user?.name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-400 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Toggle Status Confirm Modal ──────────────────────────────────────────────
const ToggleStatusModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const isActive = user?.isActive;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isActive ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
            {isActive ? <Lock size={18} className="text-orange-600" /> : <KeyRound size={18} className="text-emerald-600" />}
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800 mb-1">
              {isActive ? "Deactivate User" : "Activate User"}
            </h3>
            <p className="text-[13px] text-gray-500">
              {isActive
                ? `Deactivating ${user?.name} will prevent them from logging in.`
                : `Activating ${user?.name} will restore their access.`}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">Cancel</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition flex items-center gap-2 disabled:opacity-50 ${isActive ? "bg-orange-500 hover:bg-orange-400" : "bg-emerald-500 hover:bg-emerald-400"}`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            {loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ user, currentAdmin, canEdit, canDelete, onEdit, onDelete, onToggleStatus, index }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const roleInfo = getRoleInfo(user.role);
  const grad = getGradient(user.name);
  const isSelf = currentAdmin?._id === user._id || currentAdmin?.id === user._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 px-5 py-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all group shadow-sm"
    >
      {/* Avatar */}
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 shadow-md`}>
        {getInitials(user.name)}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-bold text-gray-800 truncate">{user.name}</span>
          {isSelf && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Crown size={9} /> You
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
      </div>

      {/* Role badge */}
      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${roleInfo.bg} ${roleInfo.border}`}>
        <Shield size={10} className={roleInfo.color} />
        <span className={`text-[11px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</span>
      </div>

      {/* Status */}
      <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${user.isActive ? "bg-emerald-50 border border-emerald-200" : "bg-gray-100 border border-gray-200"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
        <span className={`text-[11px] font-medium ${user.isActive ? "text-emerald-700" : "text-gray-500"}`}>
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Actions */}
      {(canEdit || canDelete) && !isSelf && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={15} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {canEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(user); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition"
                  >
                    <Edit2 size={13} className="text-emerald-600" /> Edit User
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); onToggleStatus(user); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition"
                  >
                    {user.isActive
                      ? <><ToggleLeft size={13} className="text-orange-500" /> Deactivate</>
                      : <><ToggleRight size={13} className="text-emerald-600" /> Activate</>
                    }
                  </button>
                )}
                {canDelete && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(user); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={13} /> Delete User
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main ViewUsers Component ─────────────────────────────────────────────────
const ViewUsers = () => {
  const { admin, hasPermission } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const token = localStorage.getItem("adminToken");

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("ROLES API RESPONSE:", data);
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error loading users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch custom roles for role selector
  const fetchCustomRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allRoles = data.roles
          || [...(data.systemRoles || []), ...(data.customRoles || [])];
        setCustomRoles(allRoles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
  }, []);

  // Create user
  const handleCreate = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to create user"); return; }
      toast.success("User created successfully 🎉");
      setShowCreateModal(false);
      fetchUsers();
    } catch {
      toast.error("Server error");
    }
  };

  // Update user
  const handleEdit = async (payload, userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to update user"); return; }
      toast.success("User updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error("Server error");
    }
  };

  // Delete user
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to delete user"); return; }
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error("Server error");
    }
  };

  // Toggle status
  const handleToggleStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${toggleTarget._id}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to update status"); return; }
      toast.success(`User ${toggleTarget.isActive ? "deactivated" : "activated"} successfully`);
      setToggleTarget(null);
      fetchUsers();
    } catch {
      toast.error("Server error");
    }
  };

  // Filters
  const uniqueRoles = [
    ...new Set(
      users
        .map((u) => String(u.role || "").trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800">User Management</h2>
          <p className="text-gray-400 text-[13px] mt-0.5">
            Manage team members, roles, and account access · {stats.total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchUsers(); }}
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <RefreshCw size={14} />
          </button>
          {hasPermission("create_users") && (
            <button
              onClick={async () => {
                await fetchCustomRoles();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition shadow-sm"
            >
              <Plus size={15} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: stats.total,    color: "text-gray-800",    bg: "bg-white",       border: "border-gray-100" },
          { label: "Active",      value: stats.active,   color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
          { label: "Inactive",    value: stats.inactive, color: "text-gray-500",    bg: "bg-gray-50",     border: "border-gray-200" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm`}>
            <span className="text-[12px] text-gray-400 font-medium">{s.label}</span>
            <span className={`text-[22px] font-black tabular-nums ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px]">
          <Filter size={12} className="text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>{getRoleInfo(r).label}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px]">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ── Users list ── */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((user, idx) => (
              <UserRow
                key={user._id}
                user={user}
                currentAdmin={admin}
                index={idx}
                canEdit={hasPermission("edit_users")}
                canDelete={hasPermission("delete_users")}
                onEdit={async (user) => {
                  await fetchCustomRoles();
                  setEditUser(user);
                }}
                onDelete={setDeleteTarget}
                onToggleStatus={setToggleTarget}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <UserCog size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-[14px] font-semibold">No users found</p>
              <p className="text-gray-400 text-[12px] mt-1">
                {search ? `No results for "${search}"` : "Create your first user to get started"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreateModal && (
          <UserModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreate}
            customRoles={customRoles}
          />
        )}
        {editUser && (
          <UserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleEdit}
            customRoles={customRoles}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            user={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
        {toggleTarget && (
          <ToggleStatusModal
            user={toggleTarget}
            onClose={() => setToggleTarget(null)}
            onConfirm={handleToggleStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewUsers;