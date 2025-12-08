export default function Home() {
  return (
    <div className="p-6 md:p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Giriş Ekranı</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          İşlem Yönetim Sistemi'ne hoş geldiniz. Aşağıdaki bölümleri kullanarak 
          sembolleri ve işlemleri yönetebilirsiniz.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Symbols Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📦</div>
              <h2 className="text-xl font-semibold">Sembol Tanımları</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Alım satım yaptığınız sembolleri tanımlayın, rapor kodlarını ve 
              notlarını ekleyin.
            </p>
            <a
              href="/symbols"
              className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Sembol Yönetimine Git →
            </a>
          </div>

          {/* Transactions Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400 transition-colors bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📊</div>
              <h2 className="text-xl font-semibold">İşlem Kayıtları</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Alım ve satım işlemlerinizi kaydedin. Bakiye takibini otomatik olarak 
              yapın.
            </p>
            <a
              href="/transactions"
              className="inline-block px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              İşlemlere Git →
            </a>
          </div>

          {/* Reports Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📈</div>
              <h2 className="text-xl font-semibold">Raporlar</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              İşlemlerinizin istatistiklerini görün, grafikler üzerinden analiz 
              yapın.
            </p>
            <a
              href="/reports"
              className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Raporlara Git →
            </a>
          </div>

          {/* Quick Start Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-400 transition-colors bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">⚡</div>
              <h2 className="text-xl font-semibold">Hızlı Başlangıç</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Adım adım kılavuzu takip ederek sisteme başlayın.
            </p>
            <ol className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>1. Sembol Tanımları sayfasında ilk sembolü ekleyin</li>
              <li>2. İşlem Kayıtları sayfasında alım işlemi yapın</li>
              <li>3. Satım işlemini kaydedin</li>
            </ol>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 İpucu</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Sol tarafta yer alan menüden istediğiniz sayfaya hızlıca gidebilirsiniz. 
            Sağ üstte tema değiştirme düğmesi bulunmaktadır. Menüyü daraltıp genişletmek 
            için yan tarafındaki okuna tıklayın.
          </p>
        </div>
      </main>
    </div>
  );
}
