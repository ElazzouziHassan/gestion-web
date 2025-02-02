import LoginForm from "@/components/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
        style={{ backgroundImage: "url('/api/placeholder?width=1920&height=1080')" }}
      ></div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Connexion Admin</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

