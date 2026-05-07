import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { OrderAddress, SavedAddress, SavedCard, WishlistList } from "../types";

type AddressForm = OrderAddress & { label: string };

const EMPTY_ADDRESS: AddressForm = {
  label: "",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
};

type CardForm = {
  label: string;
  cardholderFullName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type ConfirmDelete = {
  kind: "address" | "card";
  id: number;
  label: string;
};

const EMPTY_CARD: CardForm = {
  label: "",
  cardholderFullName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

const formatCardNumber = (digits: string) =>
  digits.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (raw: string) => {
  const v = raw.replace(/\D/g, "").slice(0, 4);
  return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
};

export default function Account() {
  const { user, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saved" | "error">("idle");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [passwordStage, setPasswordStage] = useState<"idle" | "sent" | "verified">("idle");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "deleted" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | "new">("new");
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);
  const [loadingCards, setLoadingCards] = useState(true);
  const [savingCard, setSavingCard] = useState(false);
  const [cardStatus, setCardStatus] = useState<"idle" | "saved" | "deleted" | "error">("idle");
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardForm, string>>>({});

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  const [wishlists, setWishlists] = useState<WishlistList[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(true);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfileStatus("idle");
    setProfileError(null);
  }, [user]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roles: Record<string, string> = {
    customer: "Customer",
    sales_manager: "Sales Manager",
    product_manager: "Product Manager",
  };

  const validateProfile = () => {
    if (!profileName.trim()) {
      setProfileError("Name is required.");
      return false;
    }
    const normalizedEmail = profileEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setProfileError("Please enter a valid email address.");
      return false;
    }
    setProfileError(null);
    return true;
  };

  const handleEditProfile = () => {
    setProfileError(null);
    setProfileStatus("idle");
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfileError(null);
    setProfileStatus("idle");
    setIsEditingProfile(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setProfileSaving(true);
    setProfileStatus("idle");
    try {
      await updateProfile(profileName.trim(), profileEmail.trim());
      setProfileStatus("saved");
      setIsEditingProfile(false);
      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch (err: any) {
      setProfileStatus("error");
      if (err?.response?.data?.error) {
        setProfileError(err.response.data.error);
      } else {
        setProfileError("Unable to update profile. Please try again.");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const validatePasswordChange = () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handlePasswordChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

    setPasswordLoading(true);
    setPasswordStage("idle");
    setVerificationError(null);
    try {
      await api.post("/users/me/password-change", { password: newPassword });
      setPasswordStage("sent");
    } catch (err: any) {
      setPasswordStage("idle");
      setPasswordError(
        err.response?.data?.error || "Unable to initiate password change. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChangeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setVerificationError("Verification code is required.");
      return;
    }

    setVerificationLoading(true);
    try {
      await api.post("/users/me/password-change/verify", { code: verificationCode.trim() });
      setPasswordStage("verified");
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setVerificationCode("");
      setShowPassword(false);
      setPasswordError(null);
      setVerificationError(null);
    } catch (err: any) {
      setVerificationError(
        err.response?.data?.error || "Verification failed. Please check your code and try again."
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  // Load the user's saved default address on mount
  useEffect(() => {
    api
      .get("/users/me/addresses")
      .then(({ data }) => {
        const loaded: SavedAddress[] = data.addresses || [];
        setAddresses(loaded);
        if (loaded.length > 0) {
          setSelectedAddressId(loaded[0].id);
          setAddress({ ...loaded[0] });
        } else {
          setSelectedAddressId("new");
          setAddress(EMPTY_ADDRESS);
        }
      })
      .catch(() => {
        // silently ignore — address stays empty, user can fill it in
      })
      .finally(() => setLoadingAddress(false));
  }, []);

  useEffect(() => {
    api
      .get("/users/me/cards")
      .then(({ data }) => {
        const loaded: SavedCard[] = data.cards || [];
        setCards(loaded);
        if (loaded.length > 0) {
          selectCard(loaded[0]);
        }
      })
      .catch(() => {
        // silently ignore — user can still add a new card
      })
      .finally(() => setLoadingCards(false));
  }, []);

  useEffect(() => {
    api
      .get("/wishlists")
      .then(({ data }) => setWishlists(data))
      .catch(() => setWishlists([]))
      .finally(() => setLoadingWishlists(false));
  }, []);

  const selectCard = (c: SavedCard) => {
    setSelectedCardId(c.id);
    setCard({
      label: c.label,
      cardholderFullName: c.cardholderFullName,
      cardNumber: formatCardNumber(c.cardNumber),
      expiry: c.expiry,
      cvv: c.cvv,
    });
    setCardErrors({});
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof AddressForm, string>> = {};
    if (!address.label.trim()) e.label = "Address label is required";
    const duplicate = addresses.some(
      (a) =>
        a.label.toLowerCase() === address.label.trim().toLowerCase() &&
        (selectedAddressId === "new" || a.id !== selectedAddressId)
    );
    if (duplicate) e.label = "Address label must be unique.";
    if (!address.fullName.trim()) e.fullName = "Required";
    if (!address.line1.trim())    e.line1    = "Required";
    if (!address.city.trim())     e.city     = "Required";
    if (!/^\d{5}$/.test(address.postalCode.trim())) {
      e.postalCode = "Postal code must be exactly 5 digits.";
    }
    if (!address.country.trim())  e.country  = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateCardForm = (): boolean => {
    const e: Partial<Record<keyof CardForm, string>> = {};
    const trimmedLabel = card.label.trim();
    if (!trimmedLabel) {
      e.label = "Card label is required";
    } else {
      const duplicate = cards.some(
        (c) =>
          c.label.toLowerCase() === trimmedLabel.toLowerCase() &&
          (selectedCardId === "new" || c.id !== selectedCardId)
      );
      if (duplicate) e.label = "Card label must be unique.";
    }
    if (!/^[A-Za-zÇçĞğİıÖöŞşÜü\s'.-]{2,}$/.test(card.cardholderFullName.trim())) {
      e.cardholderFullName = "Cardholder full name is required";
    }
    if (!/^\d{16}$/.test(card.cardNumber.replace(/\s/g, ""))) {
      e.cardNumber = "Card number must be exactly 16 digits";
    }
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      e.expiry = "Use MM/YY format";
    } else {
      const [mm, yy] = card.expiry.split("/").map(Number);
      if (mm < 1 || mm > 12) {
        e.expiry = "Invalid month";
      } else {
        const fullYear = 2000 + yy;
        const now = new Date();
        if (
          fullYear < now.getFullYear() ||
          (fullYear === now.getFullYear() && mm < now.getMonth() + 1)
        ) {
          e.expiry = "Card has expired";
        }
      }
    }
    if (!/^\d{3}$/.test(card.cvv)) {
      e.cvv = "CVV must be exactly 3 digits";
    }
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setStatus("idle");
    try {
      const payload = {
        label: address.label.trim(),
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      };

      const { data } =
        selectedAddressId === "new"
          ? await api.post("/users/me/addresses", payload)
          : await api.put(`/users/me/addresses/${selectedAddressId}`, payload);

      const saved: SavedAddress = data.address;
      setAddresses((prev) => {
        const idx = prev.findIndex((a) => a.id === saved.id);
        if (idx === -1) return [saved, ...prev];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      setSelectedAddressId(saved.id);
      setAddress({ ...saved });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    setSaving(true);
    setStatus("idle");
    try {
      await api.delete(`/users/me/addresses/${addressId}`);
      const remaining = addresses.filter((a) => a.id !== addressId);
      setAddresses(remaining);
      if (remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
        setAddress({ ...remaining[0] });
      } else {
        setSelectedAddressId("new");
        setAddress(EMPTY_ADDRESS);
        setErrors({});
      }
      setStatus("deleted");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCardForm()) return;
    setSavingCard(true);
    setCardStatus("idle");
    try {
      const payload = {
        label: card.label.trim(),
        cardholderFullName: card.cardholderFullName.trim(),
        cardNumber: card.cardNumber.replace(/\s/g, ""),
        cvv: card.cvv,
        expiry: card.expiry,
      };

      const { data } =
        selectedCardId === "new"
          ? await api.post("/users/me/cards", payload)
          : await api.put(`/users/me/cards/${selectedCardId}`, payload);

      const saved: SavedCard = data.card;
      setCards((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx === -1) return [saved, ...prev];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      selectCard(saved);
      setCardStatus("saved");
      setTimeout(() => setCardStatus("idle"), 2500);
    } catch {
      setCardStatus("error");
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    setSavingCard(true);
    setCardStatus("idle");
    try {
      await api.delete(`/users/me/cards/${cardId}`);
      const remaining = cards.filter((c) => c.id !== cardId);
      setCards(remaining);
      if (remaining.length > 0) {
        selectCard(remaining[0]);
      } else {
        setSelectedCardId("new");
        setCard(EMPTY_CARD);
        setCardErrors({});
      }
      setCardStatus("deleted");
      setTimeout(() => setCardStatus("idle"), 2500);
    } catch {
      setCardStatus("error");
    } finally {
      setSavingCard(false);
    }
  };

  const openDeleteAddressDialog = () => {
    if (selectedAddressId === "new") return;
    const selected = addresses.find((a) => a.id === selectedAddressId);
    setConfirmDelete({
      kind: "address",
      id: selectedAddressId,
      label: selected?.label || "this address",
    });
  };

  const openDeleteCardDialog = () => {
    if (selectedCardId === "new") return;
    const selected = cards.find((c) => c.id === selectedCardId);
    setConfirmDelete({
      kind: "card",
      id: selectedCardId,
      label: selected?.label || "this card",
    });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    if (target.kind === "address") {
      await handleDeleteAddress(target.id);
    } else {
      await handleDeleteCard(target.id);
    }
  };

  const field = (
    key: keyof AddressForm,
    label: string,
    placeholder: string,
    optional = false,
  ) => (
    <div>
      <label className="input-label">
        {label}
        {optional && <span className="text-brand-400 ml-1">(optional)</span>}
      </label>
      <input
        type="text"
        value={address[key] ?? ""}
        onChange={(e) => {
          const nextValue =
            key === "postalCode"
              ? e.target.value.replace(/\D/g, "").slice(0, 5)
              : e.target.value;
          setAddress((prev) => ({ ...prev, [key]: nextValue }));
        }}
        placeholder={placeholder}
        className={
          key === "postalCode"
            ? "input-field font-mono tracking-[0.15em]"
            : "input-field"
        }
        inputMode={key === "postalCode" ? "numeric" : undefined}
        maxLength={key === "postalCode" ? 5 : undefined}
      />
      {errors[key] && <p className="input-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-full bg-brand-900 text-brand-50 flex items-center justify-center font-display text-lg font-semibold">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">
            {user.name}
          </h1>
          <p className="text-sm text-brand-500">{user.email}</p>
        </div>
      </div>

      {/* Account Details */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium">
            Account Details
          </h2>
          <button
            type="button"
            onClick={isEditingProfile ? handleCancelProfileEdit : handleEditProfile}
            className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            {isEditingProfile ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="border border-brand-200 bg-white">
          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} className="p-6 space-y-4" noValidate>
              <div>
                <label className="input-label">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex items-center gap-4 pt-1">
                <button type="submit" disabled={profileSaving} className="btn-primary">
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelProfileEdit}
                  disabled={profileSaving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                {profileStatus === "saved" && (
                  <span className="text-sm text-green-600">Profile updated successfully.</span>
                )}
                {profileStatus === "error" && (
                  <span className="text-sm text-red-600">Failed to update profile.</span>
                )}
              </div>
              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            </form>
          ) : (
            <div className="divide-y divide-brand-100">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Account Type" value={roles[user.role] || user.role} />
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-xs tracking-wider uppercase text-brand-500 font-medium">
                  Password
                </span>
                <span className="text-sm text-brand-900">••••••••</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-xs tracking-wider uppercase text-brand-500 font-medium">
                  Change Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(true);
                    setPasswordStage("idle");
                    setPasswordError(null);
                    setVerificationError(null);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setVerificationCode("");
                  }}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                >
                  Change password
                </button>
              </div>
              <Row
                label="Member Since"
                value={new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </div>
          )}
        </div>
      </section>

      {isChangingPassword && (
        <section className="mb-10 border border-brand-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium">
                Verify Password Change
              </h2>
              <p className="text-sm text-brand-500 mt-1">
                Enter a new password and verify it using the code sent to your email.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(false);
                setPasswordError(null);
                setVerificationError(null);
              }}
              className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              Close
            </button>
          </div>

          <form onSubmit={passwordStage === "sent" ? handlePasswordChangeVerify : handlePasswordChangeRequest} className="space-y-4" noValidate>
            <div>
              <label className="input-label">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                placeholder="Enter a new password"
              />
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="input-field"
                placeholder="Re-enter your new password"
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-500">
              <input
                id="show-password-account"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="show-password-account" className="cursor-pointer">
                Show password
              </label>
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

            {passwordStage === "sent" ? (
              <>
                <div>
                  <label className="input-label">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input-field"
                    placeholder="123456"
                    inputMode="numeric"
                  />
                  {verificationError && (
                    <p className="input-error">{verificationError}</p>
                  )}
                </div>
                <button type="submit" disabled={verificationLoading} className="btn-primary">
                  {verificationLoading ? "Verifying..." : "Verify Code"}
                </button>
              </>
            ) : (
              <button type="submit" disabled={passwordLoading} className="btn-primary">
                {passwordLoading ? "Sending code..." : "Send verification code"}
              </button>
            )}

            {passwordStage === "sent" && (
              <p className="text-sm text-brand-500">
                A verification code has been sent to your email. Please enter it here to complete the password change.
              </p>
            )}
            {passwordStage === "verified" && (
              <p className="text-sm text-green-600">Your password has been changed successfully.</p>
            )}
          </form>
        </section>
      )}

      {/* Default Delivery Address — Story 14 */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Default Delivery Address
        </h2>

        {loadingAddress ? (
          <div className="border border-brand-200 p-6 text-sm text-brand-400">
            Loading address…
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="border border-brand-200 p-6 space-y-4"
            noValidate
          >
            <div>
              <label className="input-label">Saved Addresses</label>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "new") {
                    setSelectedAddressId("new");
                    setAddress(EMPTY_ADDRESS);
                    setErrors({});
                    return;
                  }
                  const id = Number(value);
                  const selected = addresses.find((a) => a.id === id);
                  if (!selected) return;
                  setSelectedAddressId(id);
                  setAddress({ ...selected });
                  setErrors({});
                }}
                className="input-field"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
                <option value="new">+ Add New Address</option>
              </select>
              <p className="text-xs text-brand-400 mt-2">
                {selectedAddressId === "new" ? "Creating a new saved address" : "Updating selected saved address"}
              </p>
            </div>

            {field("label", "Address Label", "Home 1")}
            {field("fullName",   "Full Name",       "John Smith")}
            {field("line1",      "Address Line 1",  "123 Main Street")}
            {field("line2",      "Address Line 2",  "Apt 4B", true)}
            <div className="grid grid-cols-2 gap-4">
              {field("city",       "City",            "Istanbul")}
              {field("postalCode", "Postal Code",     "00000")}
            </div>
            {field("country",    "Country",         "Turkey")}

            <div className="flex items-center gap-4 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : selectedAddressId === "new" ? "Save" : "Update"}
              </button>
              {selectedAddressId !== "new" && (
                <button
                  type="button"
                  onClick={openDeleteAddressDialog}
                  disabled={saving}
                  className="text-xs tracking-widest uppercase text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete this address
                </button>
              )}
              {status === "saved" && (
                <span className="text-sm text-green-600">
                  Address saved successfully.
                </span>
              )}
              {status === "deleted" && (
                <span className="text-sm text-green-600">
                  Address deleted.
                </span>
              )}
              {status === "error" && (
                <span className="text-sm text-red-600">
                  Failed to save. Please try again.
                </span>
              )}
            </div>

            <p className="text-xs text-brand-400">
              This address will be pre-filled at checkout. You can always use a
              different address for a specific order.
            </p>
          </form>
        )}
      </section>

      {/* Wishlists */}
      <section className="mb-10">
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Wishlists
        </h2>

        {loadingWishlists ? (
          <div className="border border-brand-200 p-6 text-sm text-brand-400">
            Loading wishlists...
          </div>
        ) : wishlists.length === 0 ? (
          <div className="border border-brand-200 p-6 text-sm text-brand-400">
            You have not created any wishlists yet.
          </div>
        ) : (
          <div className="border border-brand-200 divide-y divide-brand-100">
            {wishlists.map((w) => (
              <Link
                key={w.id}
                to={`/wishlist?list=${w.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-50 transition-colors"
              >
                <span className="text-sm text-brand-900">{w.name}</span>
                <span className="text-xs text-brand-400">{w.itemCount} items</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Saved Payment Cards */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Saved Payment Cards
        </h2>

        {loadingCards ? (
          <div className="border border-brand-200 p-6 text-sm text-brand-400">
            Loading cards…
          </div>
        ) : (
          <form
            onSubmit={handleSaveCard}
            className="border border-brand-200 p-6 space-y-4"
            noValidate
          >
            <div>
              <label className="input-label">Saved Cards</label>
              <select
                value={selectedCardId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "new") {
                    setSelectedCardId("new");
                    setCard(EMPTY_CARD);
                    setCardErrors({});
                    return;
                  }
                  const id = Number(value);
                  const selected = cards.find((c) => c.id === id);
                  if (selected) selectCard(selected);
                }}
                className="input-field"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — •••• {c.last4}
                  </option>
                ))}
                <option value="new">+ Add New Card</option>
              </select>
              <p className="text-xs text-brand-400 mt-2">
                {selectedCardId === "new" ? "Creating a new saved card" : "Updating selected saved card"}
              </p>
            </div>

            <div>
              <label className="input-label">Card Label</label>
              <input
                type="text"
                value={card.label}
                onChange={(e) => setCard((p) => ({ ...p, label: e.target.value }))}
                placeholder="My Visa"
                className="input-field"
              />
              {cardErrors.label && <p className="input-error">{cardErrors.label}</p>}
            </div>

            <div>
              <label className="input-label">Cardholder Full Name</label>
              <input
                type="text"
                value={card.cardholderFullName}
                onChange={(e) => setCard((p) => ({ ...p, cardholderFullName: e.target.value }))}
                placeholder="John Smith"
                autoComplete="cc-name"
                className="input-field"
              />
              {cardErrors.cardholderFullName && (
                <p className="input-error">{cardErrors.cardholderFullName}</p>
              )}
            </div>

            <div>
              <label className="input-label">Card Number</label>
              <input
                type="text"
                value={card.cardNumber}
                onChange={(e) => setCard((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                className="input-field font-mono tracking-[0.15em]"
              />
              {cardErrors.cardNumber && <p className="input-error">{cardErrors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Expiry</label>
                <input
                  type="text"
                  value={card.expiry}
                  onChange={(e) => setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  className="input-field font-mono"
                />
                {cardErrors.expiry && <p className="input-error">{cardErrors.expiry}</p>}
              </div>
              <div>
                <label className="input-label">Security Code</label>
                <input
                  type="text"
                  value={card.cvv}
                  onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                  placeholder="000"
                  maxLength={3}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  className="input-field font-mono"
                />
                {cardErrors.cvv && <p className="input-error">{cardErrors.cvv}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 flex-wrap">
              <button type="submit" disabled={savingCard} className="btn-primary">
                {savingCard ? "Saving..." : selectedCardId === "new" ? "Save" : "Update"}
              </button>
              {selectedCardId !== "new" && (
                <button
                  type="button"
                  onClick={openDeleteCardDialog}
                  disabled={savingCard}
                  className="text-xs tracking-widest uppercase text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete this card
                </button>
              )}
              {cardStatus === "saved" && (
                <span className="text-sm text-green-600">Card saved successfully.</span>
              )}
              {cardStatus === "deleted" && (
                <span className="text-sm text-green-600">Card deleted.</span>
              )}
              {cardStatus === "error" && (
                <span className="text-sm text-red-600">
                  Failed to save. Please try again.
                </span>
              )}
            </div>

            <p className="text-xs text-brand-400">
              Saved cards autofill the payment form at checkout — including the
              cardholder name you entered for that specific card.
            </p>
          </form>
        )}
      </section>
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 px-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-brand-200 shadow-xl">
            <div className="px-6 py-5 border-b border-brand-100">
              <h3 className="font-display text-lg text-brand-900">
                {confirmDelete.kind === "address"
                  ? "Delete saved address?"
                  : "Delete saved card?"}
              </h3>
              <p className="text-sm text-brand-500 mt-2">
                Delete "{confirmDelete.label}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-6 py-3 text-xs tracking-widest uppercase font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5">
      <span className="text-xs tracking-wider uppercase text-brand-500 font-medium">
        {label}
      </span>
      <span className="text-sm text-brand-900">{value}</span>
    </div>
  );
}
