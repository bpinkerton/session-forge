import React from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sword, Users, Calendar, Map, Trophy } from 'lucide-react'

const AuthForm = () => {
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sword className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold">SessionForge</h1>
          </div>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your campaign portal' : 'Join your D&D campaign'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-purple-600 hover:underline"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const Dashboard = () => {
  const { user, signOut } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sword className="h-8 w-8 text-purple-400 mr-2" />
              <h1 className="text-xl font-bold text-white">SessionForge</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-purple-200">{user?.email}</span>
              <Button variant="outline" onClick={signOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to SessionForge</h2>
          <p className="text-purple-200">Your D&D campaign management portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                Sessions
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage your campaign sessions and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="h-5 w-5 mr-2 text-purple-400" />
                Characters
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage party members and character sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Characters
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Map className="h-5 w-5 mr-2 text-purple-400" />
                Campaign
              </CardTitle>
              <CardDescription className="text-purple-200">
                Track your campaign progress and world
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Campaign
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Trophy className="h-5 w-5 mr-2 text-purple-400" />
                Tavern
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage your party's tavern business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Tavern
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export const Layout = () => {
  const { user, loading, initialize } = useAuthStore()

  React.useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthForm />
}