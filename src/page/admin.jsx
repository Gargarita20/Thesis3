import { useCallback, useEffect, useState } from "react"
import { API_URL } from "../config"
import "./admin.styles.css"

const TABLES = {
  local: ["Partner_Industry", "Address", "Deptmt", "Link", "Information", "LogoPath"],
  international: ["Industry", "Address", "Link", "Information", "LogoPath"],
}

function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "")
  const [password, setPassword] = useState("")
  const [kind, setKind] = useState("local")
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")

  const logout = useCallback(() => {
    sessionStorage.removeItem("adminToken")
    setToken("")
  }, [])

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/admin/${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
    if (response.status === 401) {
      logout()
      throw new Error("Session expired")
    }
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed")
    return response.status === 204 ? null : response.json()
  }, [token, logout])

  const load = useCallback(() => {
    request(kind).then(setRows).catch((error) => setMessage(error.message))
  }, [kind, request])

  useEffect(() => {
    if (token) load()
  }, [token, load])

  const login = async (event) => {
    event.preventDefault()
    setMessage("")
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Login failed")
      sessionStorage.setItem("adminToken", data.token)
      setToken(data.token)
      setPassword("")
    } catch (error) {
      setMessage(error.message)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    const { ID, ...values } = editing
    try {
      await request(ID ? `${kind}/${ID}` : kind, { method: ID ? "PUT" : "POST", body: JSON.stringify(values) })
      setEditing(null)
      setMessage("Saved")
      load()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const remove = async (row) => {
    if (!window.confirm("Delete this record?")) return
    try {
      await request(`${kind}/${row.ID}`, { method: "DELETE" })
      setMessage("Deleted")
      load()
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (!token) {
    return (
      <form className="admin_login" onSubmit={login}>
        <h1>Admin Login</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"  required autoFocus />
        <button type="submit">Log in</button>
        {message && <p className="admin_message">{message}</p>}
      </form>
    )
  }

  const fields = TABLES[kind]
  const nameField = fields[0]
  const visible = rows.filter((row) => String(row[nameField] ?? "").toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="admin_page">
      <header className="admin_header">
        <h1>Manage Partners</h1>
        <div>
          <button onClick={() => { setKind("local"); setEditing(null) }} disabled={kind === "local"}>Local</button>
          <button onClick={() => { setKind("international"); setEditing(null) }} disabled={kind === "international"}>International</button>
          <button onClick={() => setEditing({})}>Add</button>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
      <input className="admin_search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search by ${nameField}`} />
      {message && <p className="admin_message">{message}</p>}

      {editing && (
        <form className="admin_form" onSubmit={save}>
          {fields.map((field) => (
            <label key={field}>
              {field}
              {field === "Information"
                ? <textarea rows={4} value={editing[field] ?? ""} onChange={(e) => setEditing({ ...editing, [field]: e.target.value })} />
                : <input value={editing[field] ?? ""} onChange={(e) => setEditing({ ...editing, [field]: e.target.value })} />}
            </label>
          ))}
          <div>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <table className="admin_table">
        <thead>
          <tr><th>{nameField}</th><th>Address</th><th></th></tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.ID}>
              <td>{row[nameField]}</td>
              <td>{row.Address}</td>
              <td>
                <button onClick={() => setEditing(row)}>Edit</button>
                <button onClick={() => remove(row)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Admin
