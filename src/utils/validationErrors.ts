import { ZodError } from "zod";
import { AppError } from "./AppError";

export const validateInput = (schema: any, input: any) => {
  try {
    const validatedData = schema.parse(input);
    // If validation succeeds, proceed with the validated data
    return validatedData;
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle Zod validation errors
      const missingOrInvalidFields = error.errors.map((err) => ({
        field: err.path.join("."), // The field that failed validation
        message: err.message, // The error message for the field
      }));

      const errorMessage = missingOrInvalidFields.reduce((acc, field) => {
        return `${acc} ${field.field}: ${field.message},`;
      }, "");

      throw new AppError(`${errorMessage}`, 400);
    } else {
      throw new AppError("An unexpected error occurred", 500);
    }
  }
};
