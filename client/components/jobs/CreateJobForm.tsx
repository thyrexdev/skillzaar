"use client";

import { useState } from "react";
import { jobService, CreateJobData } from "@/services/jobService";

interface CreateJobFormProps {
  onClose: () => void;
  onJobCreated: () => void;
}

const CreateJobForm = ({ onClose, onJobCreated }: CreateJobFormProps) => {
  const [formData, setFormData] = useState<CreateJobData>({
    title: "",
    description: "",
    budget: 0,
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Data Science",
    "Content Writing",
    "Digital Marketing",
    "SEO",
    "Graphics Design",
    "Video Editing",
    "Translation",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" ? Number(value) : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters long";
    }

    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = "Budget must be greater than 0";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await jobService.createJob(formData);
      onJobCreated();
      onClose();
    } catch (error: any) {
      console.error("Error creating job:", error);
      if (error.response?.data?.details) {
        // Handle validation errors from backend
        const backendErrors: { [key: string]: string } = {};
        error.response.data.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            backendErrors[detail.path[0]] = detail.message;
          }
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error.response?.data?.error || "Failed to create job" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Post a New Job</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive rounded-md p-3">
                <p className="text-destructive text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.title ? "border-destructive" : "border-border"
                }`}
                placeholder="e.g., Full-Stack Web Developer Needed"
              />
              {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.category ? "border-destructive" : "border-border"
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-foreground mb-2">
                Budget ($) *
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget || ""}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.budget ? "border-destructive" : "border-border"
                }`}
                placeholder="e.g., 2500"
              />
              {errors.budget && <p className="text-destructive text-sm mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.description ? "border-destructive" : "border-border"
                }`}
                placeholder="Describe your project requirements, skills needed, deliverables, timeline, etc."
              />
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJobForm;
