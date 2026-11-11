// Lessons 7–8 · Level 2: Intermediate HTML (Forms)

export const LESSONS_07_08 = [
  {
    id: 7,
    lv: 2,
    t: 'أساسيات النماذج HTML Forms',
    en: 'HTML Forms Fundamentals',
    obj: [
      'أن تفهم بنية النموذج (form) وكيف تُرسل البيانات عبر action وmethod.',
      'أن تستخدم أنواع الإدخال المهمة (input types) بشكل صحيح.',
      'أن تربط كل حقل بتسمية (label) واضحة، وتفهم دور placeholder.',
      'أن تستخدم الخصائص required وdisabled وreadonly وتعرف الفرق بينها.',
    ],
    sec: [
      {
        h: 'بنية النموذج: form وaction وmethod',
        p: [
          '`<form>` هو الحاوية التي تجمع حقول الإدخال وترسلها إلى الخادم. له سمتان أساسيتان: `action` وهي عنوان الصفحة التي تستقبل البيانات، و`method` وهي طريقة الإرسال: `get` ترسل البيانات في الرابط (مناسبة للبحث)، و`post` ترسلها في جسم الطلب (مناسبة للبيانات الحساسة وكلمات المرور).',
          'عنصر `input` لا يحتوي على محتوى، ولذلك فهو وسم فارغ. كل حقل يجب أن يحمل سمة `name`، فالخادم يتعرف على القيم من خلالها، وبدونها لن تُرسل القيمة.',
        ],
        c: '<form action="/register" method="post">\n  <input type="text" name="username">\n  <button type="submit">إرسال</button>\n</form>',
        l: 'html',
      },
      {
        h: 'أنواع الإدخال المهمة input types',
        p: [
          'السمة `type` تحدد نوع الحقل، وتغيّر لوحة المفاتيح على الجوال وطريقة التحقق من المتصفح. أهم الأنواع: `text` للنص، و`email` للبريد مع التحقق من الشكل، و`password` لإخفاء الحروف، و`number` للأرقام، و`tel` للهاتف، و`url` للروابط، و`date` لاختيار التاريخ، و`search` للبحث، و`color` لاختيار لون، و`range` لشريط التمرير، و`file` لرفع ملف، و`checkbox` و`radio` للاختيار، و`hidden` لقيم مخفية.',
        ],
        c: '<input type="email" name="mail" placeholder="name@example.com">\n<input type="password" name="pass">\n<input type="number" name="age" min="5" max="100">\n<input type="date" name="birth">\n<input type="color" name="brand" value="#1675f9">\n<input type="range" name="level" min="1" max="10">',
        l: 'html',
      },
      {
        h: 'Labels وPlaceholders',
        p: [
          '`<label>` يربط نصًا وصفيًا بحقل معين. الربط يتم بإحدى طريقتين: إما أن يحيط الـ label بالحقل، أو أن تطابق سمة `for` في الـ label سمة `id` في الحقل. هذا الربط مهم جدًا، لأن النقر على الـ label يركّز الحقل، وقارئ الشاشة يقرأ التسمية عند التركيز عليه.',
          '`placeholder` نص إرشادي داخل الحقل يختفي عند الكتابة. لكنه **لا يغني عن الـ label**، لأنه يختفي ولا يُعتمد عليه كتسمية دائمة. استخدم الاثنين معًا: label واضح ثم placeholder لإعطاء مثال.',
        ],
        c: '<label for="fullname">الاسم الكامل</label>\n<input id="fullname" type="text" placeholder="مثال: محمد أحمد">\n\n<label>\n  البريد الإلكتروني\n  <input type="email" name="email">\n</label>',
        l: 'html',
      },
      {
        h: 'required وdisabled وreadonly',
        p: [
          '`required` تجعل الحقل إلزاميًا، والمتصفح يمنع الإرسال إذا كان فارغًا. `disabled` تعطّل الحقل تمامًا، فلا يمكن الكتابة فيه ولا يُرسل قيمته مع النموذج. `readonly` تجعل الحقل للقراءة فقط: يُرسل قيمته ويمكن نسخ نصه، لكن لا يمكن تعديله.',
          'الفرق العملي: استخدم `readonly` لعرض بيانات ثابتة مثل رقم الطلب، واستخدم `disabled` لحقل غير متاح في الوقت الحالي، واستخدم `required` لكل معلومة لا يمكن إرسال النموذج بدونها.',
        ],
        c: '<input type="text" name="order" value="ORD-2026" readonly>\n<input type="text" name="coupon" disabled placeholder="قريبًا">\n<input type="text" name="name" required>',
        l: 'html',
      },
    ],
    con: [
      ['form', 'الحاوية التي تجمع الحقول وترسلها إلى الخادم.'],
      ['action / method', 'العنوان الذي تُرسل إليه البيانات، وطريقة الإرسال get أو post.'],
      ['name', 'اسم الحقل الذي يحدد قيمته عند الإرسال، وبدونه لا تُرسل القيمة.'],
      ['label', 'تسمية نصية مربوطة بالحقل تحسّن الوضوح وإمكانية الوصول.'],
      ['placeholder', 'نص إرشادي داخل الحقل يختفي عند الكتابة ولا يغني عن label.'],
      ['required / disabled / readonly', 'خصائص تتحكم في الإلزام والتعطيل والقراءة فقط.'],
    ],
    terms: [
      ['Form', 'نموذج'],
      ['Input', 'حقل إدخال'],
      ['Input Type', 'نوع الإدخال'],
      ['Label', 'تسمية'],
      ['Placeholder', 'نص إرشادي'],
      ['Required', 'إلزامي'],
      ['Disabled', 'معطّل'],
      ['Readonly', 'للقراءة فقط'],
      ['Submit', 'إرسال'],
    ],
    ex: [
      {
        t: 'مثال 1: نموذج تسجيل مبسط',
        l: 'html',
        c: '<form action="/join" method="post">\n  <label for="n">الاسم</label>\n  <input id="n" name="name" type="text" required>\n\n  <label for="m">البريد</label>\n  <input id="m" name="email" type="email" required>\n\n  <button type="submit">تسجيل</button>\n</form>',
        n: 'كل حقل له label وname، والحقول الإلزامية مميزة بـ required.',
      },
      {
        t: 'مثال 2: ربط label بدون id',
        l: 'html',
        c: '<label>\n  اسم المستخدم\n  <input type="text" name="user">\n</label>',
        n: 'عندما يحيط label بالحقل مباشرة لا نحتاج إلى for أو id، وهذه طريقة بديلة صحيحة.',
      },
    ],
    mis: [
      ['استخدام placeholder بدلًا من label، فيختفي التوجيه عند الكتابة.', 'اكتب label دائمًا، واستخدم placeholder كمثال إضافي فقط.'],
      ['نسيان سمة name في الحقول، فلا تُرسل القيم إلى الخادم.', 'أضف name لكل حقل يحمل بيانات تريد إرسالها.'],
      ['الخلط بين disabled وreadonly، فيُتوقع إرسال قيمة حقل معطّل.', 'الحقل disabled لا يُرسل قيمته، أما readonly فيُرسلها.'],
    ],
    tips: [
      'استخدم نوع الإدخال المناسب دائمًا، فهو يحسن تجربة الجوال ويقلل أخطاء المستخدم.',
      'ضع label فوق الحقل وليس بجانبه على الجوال، فهذا أوضح وأسهل في القراءة.',
      'سمّ الحقول بأسماء إنجليزية واضحة وبدون مسافات، مثل `first_name`.',
    ],
    chal: [
      ['نموذج تواصل', 'أنشئ نموذجًا فيه حقل للاسم، وبريد إلكتروني، ورسالة. اربط كل حقل بتسميته عبر for وid.'],
      ['حقول بأنواع مختلفة', 'أضف حقل رقم للعمر بحد أدنى 5 وحد أعلى 100، وحقل تاريخ ميلاد.'],
      ['حقل للقراءة فقط', 'أضف حقلًا يعرض رقمًا ثابتًا مثل رقم الطلب، واجعله readonly.'],
    ],
    ch: [
      ['يحتوي على نموذج form بسمة action أو method', '<form[^>]*(action|method)='],
      ['يحتوي على label مرتبط بحقل', '<label[\\s\\S]*<input'],
      ['يحتوي على حقل بنوع email أو number أو date', 'type="(email|number|date)"'],
    ],
    pg: {
      tabs: ['html'],
      html: '<h2>تسجيل طالب جديد</h2>\n<form action="/register" method="post">\n  <label for="fullname">الاسم الكامل</label>\n  <input id="fullname" name="fullname" type="text" placeholder="مثال: محمد أحمد" required>\n\n  <label for="mail">البريد الإلكتروني</label>\n  <input id="mail" name="mail" type="email" placeholder="name@example.com">\n\n  <label for="age">العمر</label>\n  <input id="age" name="age" type="number" min="5" max="100">\n\n  <label for="code">رمز الطالب</label>\n  <input id="code" name="code" type="text" value="FSD-252005" readonly>\n\n  <button type="submit">إرسال</button>\n</form>',
    },
    quiz: [
      {
        t: 'm', g: 'النماذج',
        q: 'أي سمة تحدد عنوان الصفحة التي تستقبل بيانات النموذج؟',
        o: [
          ['method', 'method تحدد طريقة الإرسال get أو post، وليس العنوان.'],
          ['action', 'الإجابة الصحيحة: action تحدد العنوان الذي تُرسل إليه البيانات.'],
          ['name', 'name تحدد اسم الحقل في البيانات المرسلة، وليس عنوان الإرسال.'],
          ['target', 'target تحدد مكان فتح الرابط، ولا تحدد وجهة إرسال النموذج.'],
        ],
        a: 1,
      },
      {
        t: 'm', g: 'عناصر النماذج',
        q: 'لماذا يجب ربط كل label بحقله عبر for وid؟',
        o: [
          ['لتقليل حجم الصفحة.', 'الربط لا يؤثر على الحجم، بل على الوضوح وإمكانية الوصول.'],
          ['لأن النقر على التسمية يركّز الحقل وقارئ الشاشة يقرأها بشكل صحيح.', 'الإجابة الصحيحة: الربط يحسن الوصول ويجعل الحقل أكبر منطقة نقر.'],
          ['لتشغيل التحقق تلقائيًا.', 'التحقق يتم بـ required وأنواع الإدخال، وليس بالربط.'],
          ['لأن الـ placeholder لا يعمل بدونه.', 'الـ placeholder يعمل بشكل مستقل، والربط مرتبط بالتسميات.'],
        ],
        a: 1,
      },
      {
        t: 'm', g: 'أنواع الإدخال',
        q: 'أي نوع إدخال يناسب حقل البريد الإلكتروني؟',
        o: [
          ['type="text"', 'text يقبل أي نص، ولا يتحقق من شكل البريد.'],
          ['type="email"', 'الإجابة الصحيحة: email يتحقق من الشكل ويعرض لوحة مفاتيح مناسبة على الجوال.'],
          ['type="mail"', 'القيمة mail غير معتمدة، والنوع الصحيح هو email.'],
          ['type="address"', 'address ليس نوع إدخال معتمدًا في HTML.'],
        ],
        a: 1,
      },
      {
        t: 'm', g: 'الخصائص',
        q: 'ما الفرق بين disabled وreadonly؟',
        o: [
          ['disabled يعطّل الحقل ولا يُرسل قيمته، وreadonly يمنع التعديل ويُرسل القيمة.', 'الإجابة الصحيحة: هذا هو الفرق الجوهري بين الخاصيتين في الإرسال.'],
          ['كلاهما يعني الشيء نفسه تمامًا.', 'هناك فرق جوهري في إرسال القيمة، فلا تتطابقان.'],
          ['readonly يخفي الحقل، وdisabled يظهره.', 'كلاهما يظهر الحقل، والفرق في القدرة على التعديل والإرسال.'],
          ['disabled يلزم المستخدم بالتعبئة، وreadonly يلغي الإلزام.', 'الإلزام يتم بـ required وليس بـ disabled أو readonly.'],
        ],
        a: 0,
      },
      {
        t: 'f', g: 'النماذج',
        q: 'أكمل السمة التي تجعل الحقل إلزاميًا:',
        c: '<input type="text" name="name" ____>',
        a: ['required'],
        e: 'السمة required تجعل الحقل إلزاميًا، ويمنع المتصفح الإرسال إذا كان فارغًا.',
      },
      {
        t: 'f', g: 'عناصر النماذج',
        q: 'أكمل الربط بين التسمية والحقل عبر السمة الصحيحة:',
        c: '<label ____="mail">البريد</label>\n<input id="mail" type="email">',
        a: ['for'],
        e: 'السمة for في label تطابق id الحقل، فيتم الربط بينهما.',
      },
      {
        t: 'f', g: 'أنواع الإدخال',
        q: 'أكمل نوع الإدخال الذي يعرض منتقي التاريخ:',
        c: '<input type="____" name="birth">',
        a: ['date'],
        e: 'نوع date يعرض منتقي التاريخ، ويُرسل القيمة بصيغة سنة-شهر-يوم.',
      },
    ],
  },

  {
    id: 8,
    lv: 2,
    t: 'عناصر النماذج المتقدمة',
    en: 'Advanced Form Elements',
    obj: [
      'أن تستخدم القوائم المنسدلة select مع option وoptgroup.',
      'أن تكتب نصوصًا متعددة الأسطر باستخدام textarea.',
      'أن تفرّق بين أزرار الاختيار (radio) ومربعات الاختيار (checkbox) وتجمعها بشكل صحيح.',
      'أن تنظم النموذج بـ fieldset وlegend، وأن تفهم أنواع الأزرار button types.',
    ],
    sec: [
      {
        h: 'القوائم المنسدلة select وoption',
        p: [
          '`<select>` يعرض قائمة منسدلة، و`<option>` يمثل كل خيار داخلها. القيمة المرسلة هي سمة `value` في الخيار المختار، أما النص الظاهر فهو المحتوى بين الوسمين. ويمكن تجميع الخيارات باستخدام `optgroup`، والخيار `selected` يحدد الخيار الافتراضي.',
          'عند الحاجة إلى اختيار واحد من عدة خيارات مع عرض كل الخيارات مرة واحدة، فاستخدم radio. أما القائمة المنسدلة فتناسب عددًا كبيرًا من الخيارات.',
        ],
        c: '<label for="country">الدولة</label>\n<select id="country" name="country">\n  <option value="">اختر دولتك</option>\n  <optgroup label="مصر والخليج">\n    <option value="eg" selected>مصر</option>\n    <option value="sa">السعودية</option>\n  </optgroup>\n  <option value="other">أخرى</option>\n</select>',
        l: 'html',
      },
      {
        h: 'حقل النص متعدد الأسطر textarea',
        p: [
          '`<textarea>` يعطي مساحة كتابة متعددة الأسطر، وتحدد أبعاده بالسمتين `rows` و`cols`، أو بـ CSS. لاحظ أن textarea له وسم إغلاق، والنص الافتراضي يُكتب بينهما وليس في سمة value.',
        ],
        c: '<label for="msg">رسالتك</label>\n<textarea id="msg" name="msg" rows="4" placeholder="اكتب رسالتك هنا..."></textarea>',
        l: 'html',
      },
      {
        h: 'أزرار الاختيار radio ومربعات الاختيار checkbox',
        p: [
          '**radio** يسمح باختيار واحد فقط من مجموعة، والمجموعة تُحدد بأن تشترك كل الأزرار في **سمة name واحدة**. أما **checkbox** فيسمح باختيار أكثر من خيار، ويمكن أن تكون له مجموعة بالاسم نفسه أيضًا، وتُرسل القيم المختارة فقط.',
          'تذكر دائمًا: radio للاختيار الواحد، وcheckbox للاختيارات المتعددة.',
        ],
        c: '<fieldset>\n  <legend>المستوى الحالي</legend>\n  <input type="radio" id="b" name="level" value="beginner" checked>\n  <label for="b">مبتدئ</label>\n  <input type="radio" id="m" name="level" value="medium">\n  <label for="m">متوسط</label>\n</fieldset>\n\n<input type="checkbox" id="html" name="topics" value="html" checked>\n<label for="html">HTML</label>\n<input type="checkbox" id="css" name="topics" value="css">\n<label for="css">CSS</label>',
        l: 'html',
      },
      {
        h: 'تجميع الحقول: fieldset وlegend',
        p: [
          '`<fieldset>` يجمع مجموعة من الحقول المرتبطة بموضوع واحد، و`<legend>` يعطي هذه المجموعة عنوانًا. قارئات الشاشة تقرأ العنوان قبل كل حقل داخل المجموعة، وهذا يوضح السياق للمستخدم.',
        ],
      },
      {
        h: 'الأزرار وأنواعها button types',
        p: [
          'زر `<button>` له ثلاثة أنواع عبر السمة `type`: `submit` يرسل النموذج (وهو الافتراضي داخل form)، و`reset` يعيد الحقول لقيمها الأصلية، و`button` لا يفعل شيئًا بمفرده ويُستخدم مع JavaScript.',
          'احذر من نسيان type: زر بدون نوع داخل نموذج سيرسله تلقائيًا، وهذا قد يكون خطأً إذا كان زر "إلغاء" أو "عرض".',
        ],
        c: '<button type="submit">إرسال</button>\n<button type="reset">مسح الحقول</button>\n<button type="button">عرض التفاصيل</button>',
        l: 'html',
      },
    ],
    con: [
      ['select / option / optgroup', 'قائمة منسدلة وخياراتها، مع إمكانية تجميع الخيارات في مجموعات.'],
      ['textarea', 'حقل نص متعدد الأسطر يُكتب محتواه بين الوسمين.'],
      ['radio', 'اختيار واحد من مجموعة، والمجموعة تشترك في سمة name.'],
      ['checkbox', 'اختيار متعدد، تُرسل القيم المختارة فقط.'],
      ['fieldset / legend', 'تجميع منطقي للحقول مع عنوان يشرح المجموعة.'],
      ['button type', 'submit للإرسال وreset للتفريغ وbutton للسلوك المخصص.'],
    ],
    terms: [
      ['Dropdown', 'قائمة منسدلة'],
      ['Option', 'خيار'],
      ['Option Group', 'مجموعة خيارات'],
      ['Text Area', 'منطقة نص'],
      ['Radio Button', 'زر اختيار'],
      ['Checkbox', 'مربع اختيار'],
      ['Fieldset', 'مجموعة حقول'],
      ['Legend', 'عنوان المجموعة'],
      ['Submit', 'إرسال'],
      ['Reset', 'إعادة الضبط'],
    ],
    ex: [
      {
        t: 'مثال 1: استمارة كاملة مع مجموعات',
        l: 'html',
        c: '<form>\n  <fieldset>\n    <legend>بياناتك</legend>\n    <label for="city">المدينة</label>\n    <select id="city" name="city">\n      <option value="cairo">القاهرة</option>\n      <option value="giza">الجيزة</option>\n    </select>\n    <label for="bio">نبذة قصيرة</label>\n    <textarea id="bio" name="bio" rows="3"></textarea>\n  </fieldset>\n  <button type="submit">حفظ</button>\n</form>',
        n: 'تجميع الحقول داخل fieldset يوضح السياق لقارئات الشاشة ويرتب النموذج بصريًا.',
      },
      {
        t: 'مثال 2: اختيار متعدد مع checkbox',
        l: 'html',
        c: '<fieldset>\n  <legend>اهتماماتك</legend>\n  <input type="checkbox" id="i1" name="interest" value="web"> <label for="i1">تطوير الويب</label>\n  <input type="checkbox" id="i2" name="interest" value="design"> <label for="i2">التصميم</label>\n</fieldset>',
        n: 'يمكن اختيار أكثر من اهتمام، وستُرسل القيم المختارة فقط.',
      },
    ],
    mis: [
      ['استخدام checkbox لاختيار واحد فقط من عدة خيارات متبادلة.', 'استخدم radio مع name مشترك عندما يكون الاختيار واحدًا فقط.'],
      ['كتابة قيمة النص الافتراضي للـ textarea داخل سمة value.', 'النص الافتراضي للـ textarea يُكتب بين وسمي الافتتاح والإغلاق.'],
      ['زر داخل نموذج بدون type فيُرسل النموذج عن طريق الخطأ.', 'حدد type دائمًا: submit للإرسال وbutton للأزرار الأخرى.'],
    ],
    tips: [
      'استخدم fieldset لكل مجموعة حقول منطقية، مثل بيانات الشخصية أو بيانات الدفع.',
      'اجعل أول خيار في الـ select نصًا توجيهيًا بقيمة فارغة، مثل "اختر..."، ليتذكر المستخدم أنه يجب الاختيار.',
      'تأكد من أن كل مجموعة radio لها name مشترك واحد فقط، وإلا فسيعمل كل زر بشكل منفصل.',
    ],
    chal: [
      ['قائمة دول', 'أنشئ select يحتوي على ثلاث دول، واجعل إحداها مختارة افتراضيًا باستخدام selected.'],
      ['اختيار الجنس والمستوى', 'أنشئ مجموعتين من radio داخل fieldset مستقل، واستخدم name مختلفًا لكل مجموعة.'],
      ['زر إعادة الضبط', 'أضف زرين: إرسال ومسح، مع تحديد type صحيح لكل زر.'],
    ],
    ch: [
      ['يحتوي على select وoption', '<select[\\s\\S]*<option'],
      ['يحتوي على fieldset وlegend', '<fieldset[\\s\\S]*<legend'],
      ['يحتوي على radio وcheckbox', 'type="radio"[\\s\\S]*type="checkbox"|type="checkbox"[\\s\\S]*type="radio"'],
    ],
    pg: {
      tabs: ['html'],
      html: '<form>\n  <fieldset>\n    <legend>بيانات الدورة</legend>\n\n    <label for="level">المستوى</label>\n    <select id="level" name="level">\n      <option value="">اختر المستوى</option>\n      <option value="1">مبتدئ</option>\n      <option value="2" selected>متوسط</option>\n    </select>\n\n    <label for="note">ملاحظاتك</label>\n    <textarea id="note" name="note" rows="3"></textarea>\n  </fieldset>\n\n  <fieldset>\n    <legend>الجنس</legend>\n    <input type="radio" id="m" name="gender" value="m"> <label for="m">ذكر</label>\n    <input type="radio" id="f" name="gender" value="f"> <label for="f">أنثى</label>\n  </fieldset>\n\n  <fieldset>\n    <legend>المواد التي تدرسها</legend>\n    <input type="checkbox" id="h" name="subject" value="html" checked> <label for="h">HTML</label>\n    <input type="checkbox" id="c" name="subject" value="css"> <label for="c">CSS</label>\n  </fieldset>\n\n  <button type="submit">إرسال</button>\n  <button type="reset">مسح</button>\n</form>',
    },
    quiz: [
      {
        t: 'm', g: 'عناصر النماذج',
        q: 'أي عنصر يُستخدم لعرض قائمة منسدلة يختار منها المستخدم؟',
        o: [
          ['<select>', 'الإجابة الصحيحة: select مع option ينشئ قائمة منسدلة.'],
          ['<list>', 'وسم list غير موجود في HTML.'],
          ['<dropdown>', 'وسم dropdown غير موجود، والاسم الصحيح هو select.'],
          ['<menu>', 'menu عنصر يحمل قائمة أوامر، ولا يعطي قائمة منسدلة للنماذج.'],
        ],
        a: 0,
      },
      {
        t: 'm', g: 'عناصر النماذج',
        q: 'متى نستخدم radio بدلًا من checkbox؟',
        o: [
          ['عندما يُسمح باختيار أكثر من خيار.', 'هذا وصف checkbox وليس radio.'],
          ['عندما يُسمح باختيار خيار واحد فقط من مجموعة.', 'الإجابة الصحيحة: radio يضمن اختيارًا واحدًا داخل المجموعة المشتركة في name.'],
          ['عندما نريد رفع ملف.', 'رفع الملفات يتم بـ type="file".'],
          ['عندما نريد نصًا متعدد الأسطر.', 'النص متعدد الأسطر يتم بوسم textarea.'],
        ],
        a: 1,
      },
      {
        t: 'm', g: 'عناصر النماذج',
        q: 'ما وظيفة وسم fieldset وlegend؟',
        o: [
          ['تغيير لون الحقول تلقائيًا.', 'تنسيق الألوان يتم بـ CSS، وليس بهذين الوسمين.'],
          ['تجميع مجموعة حقول مرتبطة مع عنوان يشرحها.', 'الإجابة الصحيحة: fieldset يجمع الحقول، وlegend يعطيها عنوانًا وصفيًا.'],
          ['إرسال النموذج إلى الخادم.', 'الإرسال يتم بوسم form وزر submit.'],
          ['إنشاء قاعدة بيانات للحقول.', 'HTML لا ينشئ قواعد بيانات.'],
        ],
        a: 1,
      },
      {
        t: 'm', g: 'الأزرار',
        q: 'ماذا يحدث إذا وُضع زر بدون type داخل نموذج؟',
        o: [
          ['لا يحدث شيء أبدًا.', 'الزر الافتراضي داخل النموذج يُرسل النموذج، وليس صامتًا.'],
          ['يُعامل كزر submit ويرسل النموذج.', 'الإجابة الصحيحة: القيمة الافتراضية لـ type في الزر هي submit داخل form.'],
          ['يتحول إلى رابط تلقائيًا.', 'الأزرار لا تتحول إلى روابط بشكل تلقائي.'],
          ['يُعامل كـ reset ويمسح الحقول.', 'القيمة الافتراضية submit وليست reset.'],
        ],
        a: 1,
      },
      {
        t: 'f', g: 'عناصر النماذج',
        q: 'أكمل الوسم الذي يُنشئ حقل نص متعدد الأسطر:',
        c: '<____ name="message" rows="4"></____>',
        a: ['textarea', 'textarea'],
        e: 'وسم textarea مخصص للنصوص متعددة الأسطر، والنص الافتراضي يوضع بين وسمي الافتتاح والإغلاق.',
      },
      {
        t: 'f', g: 'عناصر النماذج',
        q: 'أكمل الوسم الذي يعطي عنوانًا لمجموعة الحقول داخل fieldset:',
        c: '<fieldset>\n  <____>بيانات الحساب</____>\n</fieldset>',
        a: ['legend', 'legend'],
        e: 'وسم legend هو العنوان الذي يشرح مجموعة الحقول داخل fieldset، وتقرؤه قارئات الشاشة.',
      },
      {
        t: 'f', g: 'الأزرار',
        q: 'أكمل نوع الزر الذي يعيد الحقول إلى قيمها الأصلية:',
        c: '<button type="____">مسح</button>',
        a: ['reset'],
        e: 'نوع reset يعيد جميع حقول النموذج إلى قيمها الافتراضية التي ظهرت عند تحميل الصفحة.',
      },
    ],
  },
];
