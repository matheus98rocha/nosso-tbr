"use client";

type UserRegistrationComponentProps = {
  email: string;
  password: string;
  display_name: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  errorMessage: string | null;
  success: boolean;
};

export function UserRegistrationComponent({
  email,
  password,
  display_name,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onSubmit,
  isPending,
  errorMessage,
  success,
}: UserRegistrationComponentProps) {
  return (
    <form
      role="form"
      aria-label="User registration form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor="register-display-name">Display name</label>
        <input
          id="register-display-name"
          name="display_name"
          type="text"
          value={display_name}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          required
          autoComplete="name"
          aria-label="Display name"
          aria-required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email"
          aria-required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="Password"
          aria-required
          disabled={isPending}
        />
      </div>
      <button
        type="submit"
        aria-label="Submit registration"
        disabled={isPending}
      >
        {isPending ? "Submitting" : "Register"}
      </button>
      {errorMessage ? (
        <p role="alert" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
      {success ? (
        <p role="status" aria-live="polite">
          Registration completed. Check your email if confirmation is required.
        </p>
      ) : null}
    </form>
  );
}
