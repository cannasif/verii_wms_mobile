import i18n from '@/locales';
import { z } from 'zod';

export const createLoginSchema = () =>
  z.object({
    branchId: z.string().min(1, i18n.t('validation.branchRequired')),
    email: z.string().min(1, i18n.t('validation.emailRequired')).email(i18n.t('validation.emailInvalid')),
    password: z.string().min(1, i18n.t('validation.passwordRequired')),
    rememberMe: z.boolean(),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export const createForgotPasswordSchema = () =>
  z.object({
    email: z.string().min(1, i18n.t('validation.emailRequired')).email(i18n.t('validation.emailInvalid')),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export const createResetPasswordSchema = () =>
  z
    .object({
      token: z.string().min(1, i18n.t('validation.tokenRequired')),
      newPassword: z
        .string()
        .min(6, i18n.t('validation.newPasswordMinLength'))
        .max(100, i18n.t('validation.newPasswordMaxLength')),
      confirmPassword: z.string().min(1, i18n.t('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: i18n.t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
