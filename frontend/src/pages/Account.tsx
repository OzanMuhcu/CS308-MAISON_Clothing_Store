import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { OrderAddress, SavedAddress, SavedCard } from "../types";

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
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | "new">("new");
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);
  const [loadingCards, setLoadingCards] = useState(true);
  const [savingCard, setSavingCard] = useState(false);
  const [cardStatus, setCardStatus] = useState<"idle" | "saved" | "deleted" | "error">("idle");
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardForm, string>>>({});

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
    if (!/^[A-Za-z\s'.-]{2,}$/.test(card.cardholderFullName.trim())) {
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

  const handleDeleteCard = async () => {
    if (selectedCardId === "new") return;
    if (!window.confirm("Delete this saved card?")) return;
    setSavingCard(true);
    setCardStatus("idle");
    try {
      await api.delete(`/users/me/cards/${selectedCardId}`);
      const remaining = cards.filter((c) => c.id !== selectedCardId);
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
        <h2 className="text-xs tracking-[0.15em] uppercase text-brand-500 font-medium mb-3">
          Account Details
        </h2>
        <div className="border border-brand-200 divide-y divide-brand-100">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Account Type" value={roles[user.role] || user.role} />
          <Row
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </div>
      </section>

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
              {status === "saved" && (
                <span className="text-sm text-green-600">
                  Address saved successfully.
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
                  onClick={handleDeleteCard}
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
