"use client";

import { UserRegistrationComponent } from "@/components/userRegistration/UserRegistrationComponent";
import { useUserRegistration } from "@/services/userRegistration/hooks/useUserRegistration";

export default function RegisterPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    display_name,
    setDisplayName,
    submit,
    isPending,
    isError,
    error,
    isSuccess,
  } = useUserRegistration();

  return (
    <UserRegistrationComponent
      email={email}
      password={password}
      display_name={display_name}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onDisplayNameChange={setDisplayName}
      onSubmit={() => {
        void submit();
      }}
      isPending={isPending}
      errorMessage={isError && error ? error.message : null}
      success={isSuccess}
    />
  );
}
