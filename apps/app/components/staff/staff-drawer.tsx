"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@repo/ui/drawer";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field, FieldLabel, FieldGroup, FieldError } from "@repo/ui/field";
import { FormRootError } from "@repo/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Spinner } from "@repo/ui/spinner";
import { displayPhone, normalizePhone } from "@repo/salon-core/phone";
import {
  staffCreateSchema,
  type StaffCreateFormInput,
} from "@repo/salon-core/forms/staff";

interface StaffDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  roleLocked?: "staff" | "manager";
}

function emptyValues(roleLocked?: "staff" | "manager"): StaffCreateFormInput {
  return { name: "", phone: "", password: "", role: roleLocked ?? "staff" };
}

export function StaffDrawer({
  open,
  onOpenChange,
  onSuccess,
  roleLocked,
}: StaffDrawerProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StaffCreateFormInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: emptyValues(roleLocked),
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) reset(emptyValues(roleLocked));
  }, [open, roleLocked, reset]);

  const nameValue = watch("name");
  const phoneValue = watch("phone");
  const passwordValue = watch("password");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          role: roleLocked ?? values.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("root", { message: data.error || "افزودن پرسنل انجام نشد" });
        return;
      }

      onSuccess();
    } catch {
      setError("root", { message: "خطایی رخ داد. لطفاً دوباره تلاش کنید." });
    }
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>پرسنل جدید</DrawerTitle>
          <DrawerDescription>
            عضو جدیدی به تیم سالن اضافه کنید
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 overflow-auto p-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="staff-name">نام و نام خانوادگی</FieldLabel>
              <Input
                id="staff-name"
                placeholder="مثال: نرگس کاظمی"
                {...register("name")}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-phone">شماره موبایل</FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    id="staff-phone"
                    type="tel"
                    value={displayPhone(field.value ?? "")}
                    onChange={(e) =>
                      field.onChange(normalizePhone(e.target.value))
                    }
                    onBlur={field.onBlur}
                    placeholder="۰۹۱۲…"
                    dir="ltr"
                    className="text-left tabular-nums"
                  />
                )}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-password">رمز عبور</FieldLabel>
              <Input
                id="staff-password"
                type="password"
                placeholder="رمز ورود به سیستم"
                {...register("password")}
              />
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
              )}
            </Field>

            {roleLocked ? (
              <Field>
                <FieldLabel>نقش</FieldLabel>
                <Input
                  value={roleLocked === "staff" ? "پرسنل" : "مدیر"}
                  disabled
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>نقش</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "staff"}
                      onValueChange={(v) =>
                        field.onChange(v as "staff" | "manager")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">پرسنل</SelectItem>
                        <SelectItem value="manager">مدیر</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            <FormRootError message={errors.root?.message} />
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting || !nameValue || !phoneValue || !passwordValue
            }
            className="touch-manipulation"
          >
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting ? "در حال افزودن…" : "افزودن پرسنل"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
