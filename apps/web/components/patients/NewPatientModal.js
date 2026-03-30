import { useState, useEffect } from "react";
import { getSavedUser } from "@/utils/auth";

export default function NewPatientModal({ isOpen, onClose, onPatientCreated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
  });
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const user = getSavedUser();
      if (user && user.organization) {
        setOrganizationId(user.organization);
      } else {
        console.error("Organization ID not found for the current user.");
        alert("Cannot create patient: Organization ID is missing.");
        // You might want to alert the user or disable the form here
      }
      // Reset form when modal opens
      setForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "male",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organizationId) {
      alert("Cannot create patient: Organization ID is missing.");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("aidcare_token");
      const baseURL = process.env.NEXT_PUBLIC_API_URL;
      const payload = {
        ...form,
        organization: organizationId,
      };

      const res = await fetch(`${baseURL}/api/v1/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create patient");
      }

      const newPatient = await res.json();
      onPatientCreated(newPatient.data);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-[1001]"
      onClick={onClose}
    >
      <div
        className="bg-white w-5/6 max-w-md rounded-lg p-6 shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold pb-6 text-gray-800">New Patient</h2>
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4">
          <input
            name="firstName"
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required autoComplete="off"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 m-0"
          />
          <input
            name="lastName"
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required autoComplete="off"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 m-0"
          />
          
          <input
            name="dateOfBirth"
            type="date"
            placeholder="Date of Birth"
            value={form.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 m-0"
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 m-0"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !organizationId}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}