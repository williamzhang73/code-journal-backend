import { Link, Outlet } from 'react-router-dom';

export function NavBar() {
  return (
    <>
      <header className="purple-background">
        <div className="container">
          <div className="row">
            <div className="column-full d-flex align-center">
              <Link to="/">
                <h1 className="white-text">Code Journal</h1>
              </Link>
              <Link to="/entryList" className="entries-link white-text">
                <h3>Entries</h3>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
