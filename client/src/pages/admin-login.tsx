import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { adminLoginSchema } from "@shared/schema";

/**
 * Staff sign-in.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHAT WAS WRONG WITH THE OLD SCREEN, and why this is a rewrite rather than a touch-up:
 *
 *   1. The submit button was unreadable. It spelled `text-deep-black` on `bg-neon-green`,
 *      and `text-deep-black` generates no CSS in this project (see the long comment in
 *      tailwind.config.ts) — so the label fell back to near-white on bright green, about
 *      1.4:1. Same story for `text-neon-green` and `border-medium-gray`. Every colour here
 *      is a stock Tailwind class or an arbitrary value reading the CSS variable directly,
 *      both of which do emit rules.
 *   2. There was no way to see the password you typed — the one thing this page accepts.
 *   3. "Admin Login" and "Access Dashboard" stacked two headings that said one thing.
 *   4. Inputs and the button were 40px, below the 44px minimum for a comfortable tap.
 *
 * A sign-in screen should be quiet. What makes this one feel considered is precision — a
 * single heading, a real type hierarchy, an honest description of what is behind the
 * door — not decoration.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      toast({ title: "Login Successful", description: "Welcome to the admin dashboard!" });
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      // Clear the password only: a typo should cost one field, not both.
      form.setValue("password", "");
      form.setFocus("password");
    },
  });

  return (
    <div className="min-h-screen bg-[var(--deep-black)] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_minmax(0,26rem)] md:items-center md:gap-14">
          {/* Context: who this is for, and what is behind it. No claims, no ornament. */}
          <div>
            {/* Wrapper: the link is inline-flex, so without it the eyebrow below rides up
                onto the same line as the wordmark. */}
            <div>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--neon-green)]"
                data-testid="link-home"
              >
                <img
                  src="/Car Care (4)_1753951564515.png"
                  alt="P91 Car Care"
                  width={48}
                  height={36}
                  className="h-9 w-auto"
                  data-testid="img-logo-login"
                />
                <span className="text-lg font-semibold tracking-tight text-white">Car Care</span>
              </Link>
            </div>

            <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--neon-green)]">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Staff access
            </p>
            <h1
              className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl"
              data-testid="text-admin-login-title"
            >
              Sign in to the studio dashboard
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
              Bookings, enquiries and WhatsApp replies are managed here. Looking to book a
              service? That is on the{" "}
              <Link
                href="/"
                className="text-white underline underline-offset-4 hover:text-[var(--neon-green)]"
                data-testid="link-back-home"
              >
                main site
              </Link>
              .
            </p>
          </div>

          {/* One panel with a hairline border, rather than a glass slab floating in space. */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 sm:p-7">
            <Form {...form}>
              {/*
                noValidate: the browser's own constraint check on type="email" cancels the
                submit event before react-hook-form runs, which would replace the messages
                below with a native bubble. Validation is zod's job on this page.
              */}
              <form
                onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
                noValidate
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="username"
                          autoFocus
                          placeholder="you@example.com"
                          className="min-h-[44px] border-gray-700 bg-gray-950 text-white placeholder:text-gray-500"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={revealed ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            // pr-12 keeps the typed text clear of the reveal button.
                            className="min-h-[44px] border-gray-700 bg-gray-950 pr-12 text-white placeholder:text-gray-500"
                            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                            onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                            onBlur={() => {
                              setCapsLock(false);
                              field.onBlur();
                            }}
                            data-testid="input-password"
                          />
                          {/*
                            type="button": a bare <button> inside a form submits it.
                            Revealing the password must never post the form.
                          */}
                          <button
                            type="button"
                            onClick={() => setRevealed((v) => !v)}
                            aria-label={revealed ? "Hide password" : "Show password"}
                            aria-pressed={revealed}
                            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--neon-green)]"
                            data-testid="button-toggle-password"
                          >
                            {revealed ? (
                              <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      {/* Caps Lock is the commonest reason a correct password is rejected. */}
                      <p
                        aria-live="polite"
                        className={capsLock ? "text-xs text-amber-400" : "sr-only"}
                        data-testid="text-caps-lock"
                      >
                        {capsLock ? "Caps Lock is on." : ""}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  // text-black, not `text-deep-black`: the latter emits no CSS here, which
                  // is what left the old label near-white on bright green.
                  className="min-h-[44px] w-full bg-[var(--neon-green)] text-base font-bold text-black hover:brightness-95"
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
