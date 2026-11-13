import { FormEvent, ReactNode, useState } from 'react';

import { countries } from 'countries-list';

import { User, put } from '../api';
import { Spinner } from '../components/Spinner';
import { showSuccess } from '../components/Toast';

const phoneRegExp = /^$|^(\+\d{1,2}\s?)?1?-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

const countryList = Object.entries(countries)
  .map(([code, value]) => ({ code, name: value.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const genders = [
  { label: 'Male', value: 'm' },
  { label: 'Female', value: 'f' },
  { label: 'Non-Binary/Other', value: 'o' },
];

type Form = Record<
  | 'name'
  | 'surname'
  | 'gender'
  | 'birthDate'
  | 'phoneNumber'
  | 'city'
  | 'country',
  string
>;

function validate(form: Form) {
  const v = Object.fromEntries(Object.entries(form).map(([k, value]) => [k, value.trim()])) as Form;
  if (!v.name) return { field: 'name', message: 'Required' } as const;
  if (!v.surname) return { field: 'surname', message: 'Required' } as const;
  if (!['m', 'f', 'o'].includes(v.gender)) return { field: 'gender', message: 'Required' } as const;
  if (!phoneRegExp.test(v.phoneNumber))
    return { field: 'phoneNumber', message: 'Invalid phone number' } as const;
  return {
    data: {
      name: v.name,
      surname: v.surname,
      gender: v.gender,
      birthDate: v.birthDate || undefined,
      phoneNumber: v.phoneNumber,
      city: v.city,
      country: v.country || undefined,
    },
  };
}

export function Profile({ user, refetchUser }: { user: User; refetchUser: () => void }) {
  const [form, setForm] = useState<Form>({
    name: user.name ?? '',
    surname: user.surname ?? '',
    gender: user.gender ?? '',
    birthDate: user.birthDate ?? '',
    phoneNumber: user.phoneNumber ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
  });
  const [error, setError] = useState<{ field: keyof Form; message: string }>();
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: keyof Form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const errorFor = (field: keyof Form) => (error?.field === field ? error.message : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validate(form);
    if (!('data' in result)) {
      setError(result);
      return;
    }
    setError(undefined);
    setIsSaving(true);
    try {
      await put('user/details', result.data);
      showSuccess('Saved Changes');
      refetchUser();
    } catch {
      // put shows the error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card">
      <h2>My Profile</h2>
      <form className="form-grid" noValidate autoComplete="off" onSubmit={submit}>
        <Field label="Name *" error={errorFor('name')}>
          <input value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Surname *" error={errorFor('surname')}>
          <input value={form.surname} onChange={set('surname')} />
        </Field>
        <Field label="Gender *" error={errorFor('gender')}>
          <select value={form.gender} onChange={set('gender')}>
            <option value="" disabled />
            {genders.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Birth Date">
          <input type="date" value={form.birthDate} onChange={set('birthDate')} />
        </Field>
        <Field label="Phone Number (with country code)" error={errorFor('phoneNumber')}>
          <input
            type="tel"
            value={form.phoneNumber}
            placeholder="+1 (555) 555-5555"
            onChange={set('phoneNumber')}
          />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Country">
          <select value={form.country} onChange={set('country')}>
            <option value="" />
            {countryList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </Field>
        <div>
          <button type="submit" className="button contained large" disabled={isSaving}>
            {isSaving && <Spinner size={20} />}
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
