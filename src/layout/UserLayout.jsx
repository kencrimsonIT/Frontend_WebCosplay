import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

function UserLayout({ onLoginClick, onRegisterClick }) {
  return (
    <div className="app">
      <Header onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />

      <main className="main-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default UserLayout