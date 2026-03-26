import type {
  RegisterUserBody,
  RegisterUserFormValues,
} from "../validators/userRegistration.validator";

export const userRegistrationMapper = {
  toApiPayload(values: RegisterUserFormValues): RegisterUserBody {
    return {
      email: values.email.trim(),
      password: values.password,
      display_name: values.display_name.trim(),
    };
  },
};
