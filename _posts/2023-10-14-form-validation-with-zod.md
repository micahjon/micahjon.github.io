---
title: "Conditional Logic with Zod + React Hook Form"
date: 2023-11-15 22:54:00 -08:00
description: Strategies for conditional logic and other lessons learned
tags: post
---

When I started at Redwood last year, it became clear that a big part of my job would involve building long and complex forms. Like most software, the easiest to use forms often mask a lot of complexity under the hood, and I knew from experience that schemas and type safety would be my friends. After some research I settled on:

- React Hook Form for managing form state changes w/ minimal re-renders
- Zod for writing form schemas and doing validation

Almost a year later, with quite a few forms in production, I'm still happy with this pairing. BUT, there were definitely some major gotchas along the way, which is why I'm writing this post.

## A super simple form

Let's start with just a single email field. We use Zod to validate the email address and also generate a `FormSchema` type that React Hook Form uses to infer the field names & values.

![Email field](/assets/images/rhf-email-field.png)

```tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Setup Zod schema
const formSchema = z.object({
  email: z.string().email(),
});
type FormSchema = z.infer<typeof formSchema>;

export function Form() {
  // Setup React Hook Form validated by Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  // data is guaranteed to match FormSchema 
  const onSubmitSuccess = (data: FormSchema) => {
    console.log("Valid submission:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitSuccess)}>
      <label>
        Email
        {/* If we were to mis-type "email", we'd get a Typescript error, yay! */}
        <input type="email" {...register("email")} />
        {errors.email && <span>{errors.email.message}</span>}
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
```

_This example is a bit contrived, as we could accomplish all of this with plain HTML:_

```html
<input type="email" required />
```
</aside>

But the benefit of Zod is that it allows you to apply custom validation to any field type and you're guaranteed to end up with the schema you expect upon submission (or an intelligible error message).

## The importance of default values

There is one bug in our simple form above, and it's due to missing default values. According to `FormSchema`, `email` must always be a string, so we'd expect it to start out as an empty string. But React Hook Form does not assign default values, so email starts off as `undefined`. As expected, when watching the value, we get `undefined` (matching React Hook Form's internal state), but the `getValues()` function will return an empty string if called *after* the email input has been rendered, presumably b/c it actually checks the email input's `.value` property.

```tsx
const {
  register,
  handleSubmit,
  control,
  getValues,
  formState: { errors },
} = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
});

// useWatch() gets the form's values as tracked in JavaScript
const watchedEmail = useWatch({ control, name: "email" });
console.log("Watched email:", { email: watchedEmail });

// getValues() gets the form's values from the DOM
console.log("Email field value:", { email: getValues().email });

// Force re-rendering after email field has been rendered
const [, forceUpdate] = useReducer((x) => x + 1, 0);
useEffect(() => {
  console.log("Force re-rendering...");
  forceUpdate();
}, []);
```

![Email-related console output](/assets/images/rhf-email-console.png)


This may not sound like a big deal, but can really bite you if you have any logic based on email, as it would break during the forms first render despite Typescript being positive that it's a string!

![watchedEmail type is string](/assets/images/rhf-watchEmail.png)
![getValues().email type is string](/assets/images/rhf-getValuesemail.png)

The solution is simple: provide default values (like the [React Hook Form docs recommend](https://www.react-hook-form.com/api/useform/#defaultValues))

```tsx
} = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: "" }, // <-- Default value
});
```

_Note: if using `reset()` to clear the form, be sure to pass default values so the form is actually reset to it's initial values as you'd expect._

## Fields with more complex types

Sometimes it's nice to be able to store a value in a form that isn't a simple string, number, or other primitive type. 

For instance, let's say we want the user to select a color from a list of options in dropdown list, where each option has a label and a value.

```tsx
type Option = { label: string, value: string }
const colorOptions: Option[] = [
  { label: 'Red', value: '#E83845' },
  { label: 'Brown', value: '#9B634C' },
  { label: 'Tan', value: 'F2DFB4' },
]
```

Representing this in Zod schema is trivial:

```tsx
const optionSchema = z.object({
  name: z.string(),
  label: z.string(),
});
const formSchema = z.object({
  email: z.string().email(),
  color: optionSchema,
});
type FormSchema = z.infer<typeof formSchema>;
```

But what should our default value for this field be? I would reach for `null` in this case, since it clearly indicates that it's an empty value.

```tsx
} = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: "", color: null }, // <-- Default values
});
```

Hmm, `null` doesn't satisfy `FormSchema`:

![null color fails type check](/assets/images/rhf-color-null.png)

Of course you could use a different initial value that does satisfy FormSchema, e.g. `{value: '', label: ''}`, but at the end of the day your initial values shouldn't be constrained by your final values. I eventually threw up my hands, took a deep breath, and made peace with defining two schemas:

- `formSchema` represents a valid (complete) form submission
- `blankFormSchema` represents the form's default (blank) values

```ts
// Valid form submission
export const formSchema = z.object({
  email: z.string().email(),
  color: optionSchema,
});
export type FormSchema = z.infer<typeof formSchema>;

// Blank form values
const blankFormSchema = formSchema.extend({ color: optionSchema.nullable() });
export type BlankFormSchema = z.infer<typeof blankFormSchema>;
```

Whew! That's a lot of boilerplate just for type safety. FWIW, I typically create a separate file with a form's schemas (e.g. `my-form-schemas.ts`) to avoid cluttering my React component file.

If you sweat the details as much as I do (sigh), you may have noticed that `blankFormSchema` still expects `email` to be a valid email, not an empty string. While this is true, since the purpose of this schema is just to generate a more permissive Typescript type, it doesn't  matter. If it bothers you, could you construct that type explicity:

```ts
type Modify<T, R> = Omit<T, keyof R> & R;
export type BlankFormSchema = Modify<
  FormSchema,
  {
    color: FormSchema["color"] | null;
  }
>;
```

I typically define default values below my schemas. Verbose, I know. Evidently, it is possible to programmatically generate default values from a Zod schema using a [hacky workaround like this one](https://gist.github.com/TonyGravagno/2b744ceb99e415c4b53e8b35b309c29c), but I am reluctant to adopt it until it's actually documented and supported officially by Zod.

```tsx
export const defaultValues: BlankFormSchema = {
  email: "",
  color: null,
};

// or if I'm worried about downstream mutation...
export const getDefaultValues = (): BlankFormSchema => ({
  email: "",
  color: null,
});
```

Now that we've got two schemas, how do we apply them to the form itself?

```ts
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<BlankFormSchema>({ // BlankFormSchema encompasses all possible field values
  resolver: zodResolver(formSchema), // formSchema is used for validation
  defaultValues,
});

const onSubmitSuccess = (data: BlankFormSchema) => {
  // We know that upon submission, data satisfies FormSchema
  console.log("Valid submission:", data as FormSchema);
};
```

I'm not thrilled with this solution, but it gets the job done. Within our component, Typescript uses `BlankFormSchema` so that we are sure to handle _all possible_ field values, but upon submission we are certain that the resulting data matches `FormSchema`. 

## Conditional Logic

I wish there was an easy solution to this.

At its core, conditional logic means using the values in some fields to determine whether to show or hide other fields that depend on them. If we think of our typical form as a list of fields (or a tree with no branches), conditional logic introduces branches: multiple paths a user can take through our form.

```
             [name]
                |
             [email]
                |
(condition: is this email domain in our database?)
        / yes           \ no
      (submit)      [company name]
                           |
                   [company location]
                       (submit)
```



To represent this accurately in Zod & Typescript, we'd need to extend the base schema _for every conditional logic branch in our form_. Will this scale to large forms? Probably not. But let's at least go through the exercise of seeing what it would entail for the above example:

```tsx
const formSchemaLeft = z.object({
  name: z.string().trim().min(3),
  email: z.string().email(),
});
const formSchemaRight = formSchemaLeft.extend({
  companyName: z.string().trim().min(2),
  companyLocation: z.string().trim().min(5),
});

const formSchema = z.union([formSchemaLeft, formSchemaRight]);
type FormSchema = z.infer<typeof formSchema>;
```

...which gives us a beautiful union type:

![FormSchema type](/assets/images/rhf-formschema-union.png)

Let's imagine a user fills out this form on the right branch but fails to enter a company location before submitting. React Hook Form passes the following object to Zod for validation:

```ts
formSchema.parse({
  name: "Micah",
  email: "micah@my-company.com",
  companyName: "My Company",
  companyLocation: "",
}) 
// Result = {name: 'Micah', email: 'micah@my-company.com'}
// What? Company location is blank!
```

For union schemas, Zod will return the first schema that passes (left branch). It does not know that we only really care about the right branch in this scenario. We could try and make these schemas `.strict()` (not accepting additional properties), in which case the left branch would also fail validation, but in the case of both branches failing (left due to extra properties, right due to missing company name), Zod only exposes the error for the first failing schema in the union.

The solution is to conditionally pass React Hook Form the schema that matches our current branch. Here's how that might look...

```tsx
const { register } = useForm<BlankFormSchema>({
  resolver: function (values: BlankFormSchema, ...args) {
    // Choose correct schema for current branch
    const currentBranchSchema = isKnownDomain(values.email)
      ? formSchemaLeft
      : formSchemaRight;
    // Validate form data against chosen schema
    return zodResolver(currentBranchSchema)(values, ...args);
  },
  defaultValues,
});
```

Wow, that actually works! Unfortunately, this solution has some major issues:

1. At a high level, do we really want to have to define a new schema for every conditional logic branch?

2. Our conditional logic now lives in 3 different places
    - In our various schemas
    - In our custom resolver function (above)
    - In our Form component JSX (`useWatch()` to show/hide fields)

Gross! 

**Problem #1** (a new schema for every branch) is inherent to Zod, and will hopefully get better in a future version of Zod. Maybe `z.switch()`, the potential successor to `z.discriminatedUnion()`  will make this possible ([see discussion here](https://github.com/colinhacks/zod/issues/2106)). The TLDR is fixing it requires deep knowledge of Zod and Typescript, something I don't have.

I was able to solve **Problem #2** by giving up on the "multiple Zod schemas" approach and instead creating a single Zod schema where every conditional field is `.optional()`. Then I defined the conditional logic in a separate JavaScript object which could be re-used in both the custom resolver (to prune hidden fields before validating) and in the Form component (to determine if a field is visible). I added some other fancy stuff like dependency tracking and published a [tiny library that makes this pretty easy: rhf-conditional-logic](https://github.com/micahjon/rhf-conditional-logic).

Our above example becomes:

```ts
// Define a single form schema with conditional fields optional
const formSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().email(),
  companyName: z.string().trim().min(2).optional(),
  companyLocation: z.string().trim().min(5).optional(),
});
type FormSchema = z.infer<typeof formSchema>;

// Define conditional logic (and track dependencies)
const conditions = {
  companyName: getValues => !isKnownDomain(getValues('email')),
  companyLocation: getValues => !isKnownDomain(getValues('email')),
};
```

While I'd love if there was a way to define conditional logic within the schema, this feels like the next best thing.

Note that using a single schema with optional values results in a less precise Typescript type. The benefit of course is that you no longer need to define a new schema for every branch!

![FormSchema Typescript type](/assets/images/rhf-optional-schema.png)

In the form component we consume this conditional logic with the `useConditionalForm` and `useCondition` hooks, which wire up the custom resolver and track dependencies for us.

```tsx
export function Form() {
  const { register, getValues, control } = useConditionalForm<FormSchema>({
    conditions, // Your conditional logic definition goes here
    resolver: zodResolver(formSchema), // Required
    defaultValues, // Required
  });

  // Should the "Company Name" field be shown?
  const [showCompanyName] = useCondition(['companyName'], conditions, getValues, control)
}
```

You can read the [full README here](https://github.com/micahjon/rhf-conditional-logic#conditional-logic-for-react-hook-forms), but hopefully this gives you the gist.

If you have other ideas for how to improve this, don't hestitate to leave a comment or shoot me an email. Thanks!
