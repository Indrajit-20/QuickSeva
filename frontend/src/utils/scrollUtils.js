/**
 * Utility function to scroll to the first input element with a validation error
 * and focus it so the user can easily see and correct it.
 * 
 * @param {Object} errors - The object containing form validation errors (e.g. { fieldName: "Error message" })
 */
export const scrollToFirstError = (errors) => {
  if (!errors || typeof errors !== "object") return;

  // Find the first key that has a truthy error message
  const firstErrorKey = Object.keys(errors).find((key) => errors[key]);
  if (!firstErrorKey) return;

  // Let's look for the element in the DOM
  // Try querying by name, id, or data-attribute
  const element =
    document.querySelector(`[name="${firstErrorKey}"]`) ||
    document.getElementById(firstErrorKey) ||
    document.querySelector(`[data-error-field="${firstErrorKey}"]`);

  if (element) {
    // Scroll the element into the center of the viewport smoothly
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Focus the element after a short delay to ensure scroll animation is initiated
    setTimeout(() => {
      element.focus?.();
    }, 150);
  }
};
