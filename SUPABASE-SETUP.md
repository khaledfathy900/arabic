# 🚀 تفعيل الحسابات الحقيقية عبر Supabase

الموقع جاهز للحسابات السحابية — كل اللي محتاجه **مفتاحان** من مشروع Supabase خاص بيك،
وبعدها كل طالب يسجّل هيبقى ليه **حساب حقيقي**: يقدر يسجّل دخول تاني أي وقت ومن أي جهاز،
وسيرته بتحفظ في قاعدة بيانات سحابية.

## 1) أنشئ مشروعًا مجانيًا

1. ادخل https://supabase.com وسجّل (بتحسّب بحساب GitHub أو Google).
2. اضغط **New Project** وسمِّه مثلًا `arabic-platform` واختار كلمة مرور قاعدة البيانات.
   (اضغط **Free** — الخطة المجانية تكفي تمامًا لهذا الحجم).
3. انتظر دقيقة لحد ما المشروع يجهز.

## 2) أنشئ جدول الطلاب `profiles`

من القائمة الجانبية اضغط **SQL Editor** ثم **New query**، وانسخ والصق:

```sql
-- جدول ملفات الطلاب (حساب حقيقي لكل طالب)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  email text,
  avatar text,
  course text,
  plan text,
  price numeric,
  pay_method text,
  created_at timestamptz default now()
);

-- أمان: كل طالب يقرأ/يعدّل ملفه الشخصي فقط
alter table public.profiles enable row level security;

create policy "select own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);
```

> 💡 **مهم:** فعّل تسجيل الحساب بدون تأكيد بريد لمنع المتاعب:
> في **Authentication → Providers → Email**، اجعل **Confirm email** غير مفعّل (أو فعّله وكل طالب هيستلم إيميل تأكيد — اختياري).

## 3) انسخ المفتاحين

من القائمة الجانبية: **Project Settings → API**

- **Project URL** → مثال: `https://abcdefgh.supabase.co`
- **anon public key** → سلسلة طويلة تبدأ بـ `eyJ...`

## 4) ضعهما في الموقع

افتح `js/auth.js` وعدّل في أول سطرين:

```js
var AUTH_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",   // ← رابط مشروعك
  supabaseAnonKey: "eyJhbGciOi...",                    // ← المفتاح anon
  profileTable: "profiles"
};
```

## ✅ وبكده خلصت!

- **التسجيل** → ينشئ حساب حقيقي في Supabase + يخزّن بيانات الطالب في `profiles`.
- **تسجيل الدخول** (تبويب "تسجيل دخول" في نموذج التسجيل) → أي طالب سجّل قبل كده
  يدخل بإيميله وكلمة مروره، والمنصة تجيب بياناته ومساره من قاعدة البيانات.
- **شريط التنقل** → لو عندك جلسة صالحة، الاسم والصورة تظهر حتى لو فتحت الموقع
  من جهاز/متصفح مختلف.
- **تسجيل الخروج** → زر في صفحة الترحيب 🚪 بيمسح الجلسة.

---

## ملاحظات

- من غير مفاتيح، الموقع يشغّل نفسه عادي لكن الحساب بينحفظ في المتصفح **فقط**
  (وظهور رسالة تحذير في الكونسول).
- صورة الحساب بتترفع أصلًا مضغوطة (128×128 JPEG) فمفيش مشكلة حجم.
- كلمات المرور مش بتتخزن في المتصفح بعد التسجيل؛ هي بتتسجّل في Supabase
  بشكل آمن (hashed) وعملية الدخول بتبقى بالإيميل وكلمة المرور.