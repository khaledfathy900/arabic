/* ============================================================
   منصة الأستاذ محمد - الحسابات السحابية (Supabase)
   حساب حقيقي للطالب: تسجيل، دخول، استرجاع جلسة، خروج
   ------------------------------------------------------------
   ⚠️ لتشغيله: املأ AUTH_CONFIG أدناه ببيانات مشروعك من
   https://supabase.com (Dashboard → Project → Settings → API)
   بعدها إنشاء جدول profiles (الاستعلام موجود في SUPABASE-SETUP.md)
   بدون مفاتيح: الموقع يعمل عادي لكن الحساب محفوظ محليًا فقط.
   ============================================================ */

var AUTH_CONFIG = {
  supabaseUrl: "",   // مثال: "https://abcdefgh.supabase.co"
  supabaseAnonKey: "", // المفتاح العام anon (يبدأ بـ eyJ...)
  profileTable: "profiles"
};

var AUTH_STORAGE_KEY = "arabicSession";

function authConfigured() {
  return !!(AUTH_CONFIG.supabaseUrl && AUTH_CONFIG.supabaseAnonKey);
}

function authHeaders(extra) {
  return Object.assign(
    {
      apikey: AUTH_CONFIG.supabaseAnonKey,
      "Content-Type": "application/json"
    },
    extra || {}
  );
}

async function authRequest(url, options) {
  var res = await fetch(url, Object.assign({ headers: authHeaders() }, options || {}));
  var text = await res.text();
  var data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }
  if (!res.ok) {
    var msg = "خطأ في الاتصال بالخادم";
    if (data && data.error_description) msg = data.error_description;
    else if (data && data.msg) msg = data.msg;
    else if (data && data.message) msg = data.message;
    throw new Error(msg);
  }
  return data;
}

/* تحويل حساب (من arabicAccount) إلى صف في جدول profiles */
function authProfileRow(account, userId) {
  var row = {
    full_name: account.name || null,
    phone: account.phone || null,
    email: account.email || null,
    avatar: account.avatar || null,
    course: account.course || null,
    plan: account.planLabel || null,
    price: account.price || null,
    pay_method: account.payMethodLabel || null
  };
  if (userId) row.id = userId;
  return row;
}

/* إنشاء حساب حقيقي + دخول تلقائي */
async function authRegister(account) {
  if (!authConfigured()) throw new Error("Supabase غير مكوّن");
  var signup = await authRequest(AUTH_CONFIG.supabaseUrl + "/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email: account.email,
      password: account.pass,
      data: { full_name: account.name }
    })
  });
  var user = (signup && signup.user) || signup;
  var userId = user && user.id;
  if (!userId) throw new Error("فشل إنشاء الحساب");
  // حفظ بيانات الطالب في قاعدة البيانات
  await authRequest(AUTH_CONFIG.supabaseUrl + "/rest/v1/" + AUTH_CONFIG.profileTable, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(authProfileRow(account, userId))
  });
  // دخول تلقائي للحصول على جلسة صالحة
  return authLogin(account.email, account.pass);
}

/* تسجيل دخول بحساب موجود */
async function authLogin(email, password) {
  if (!authConfigured()) throw new Error("Supabase غير مكوّن");
  var data = await authRequest(AUTH_CONFIG.supabaseUrl + "/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email, password: password })
  });
  if (!data || !data.access_token) {
    throw new Error((data && data.error_description) || "بيانات الدخول غير صحيحة");
  }
  var session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    user: data.user || null
  };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) { /* تجاهل */ }
  var profile = await authFetchProfile(session);
  return { session: session, profile: profile };
}

/* استرجاع بيانات الطالب من قاعدة البيانات */
async function authFetchProfile(session) {
  if (!session || !session.accessToken || !session.user) return null;
  try {
    var rows = await authRequest(
      AUTH_CONFIG.supabaseUrl +
        "/rest/v1/" + AUTH_CONFIG.profileTable +
        "?id=eq." + session.user.id + "&select=*",
      { headers: { Authorization: "Bearer " + session.accessToken } }
    );
    return rows && rows[0] ? rows[0] : null;
  } catch (err) {
    return null;
  }
}

/* استرجاع الجلسة المحفوظة والتحقق من صحتها */
async function authRestoreSession() {
  if (!authConfigured()) return null;
  var session = null;
  try {
    session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch (err) {
    session = null;
  }
  if (!session || !session.accessToken || !session.user) return null;
  try {
    var user = await authRequest(AUTH_CONFIG.supabaseUrl + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + session.accessToken }
    });
    if (!user || !user.id) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    session.user = user;
    return session;
  } catch (err) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

/* تحديث بيانات الطالب بعد اختيار الدورة/الدفع */
async function authUpdateProfile(account) {
  if (!authConfigured()) return;
  var session = await authRestoreSession();
  if (!session) return;
  await authRequest(
    AUTH_CONFIG.supabaseUrl + "/rest/v1/" + AUTH_CONFIG.profileTable + "?id=eq." + session.user.id,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer " + session.accessToken, Prefer: "return=minimal" },
      body: JSON.stringify(authProfileRow(account))
    }
  );
}

/* تسجيل الخروج */
function authLogout() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("arabicAccount");
  } catch (err) { /* تجاهل */ }
}