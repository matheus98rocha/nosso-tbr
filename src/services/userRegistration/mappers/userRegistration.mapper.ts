import type { RegisterUserBody } from "../validators/userRegistration.validator";

export const userRegistrationMapper = {
  toApiPayload(values: RegisterUserBody): RegisterUserBody {
    return {
      email: values.email.trim(),
      password: values.password,
      display_name: values.display_name.trim(),
    };
  },
};
