import type {
  RegisterUserApiPayload,
  RegisterUserFormValues,
} from "../types/userRegistration.types";

export const userRegistrationMapper = {
  toApiPayload(values: RegisterUserFormValues): RegisterUserApiPayload {
    return {
      email: values.email.trim(),
      password: values.password,
      display_name: values.display_name.trim(),
    };
  },
};
