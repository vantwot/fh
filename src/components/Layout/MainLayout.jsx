import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <style jsx>{`
        .main-layout {
          display: flex;
          min-height: 100vh;
          background: #f1f2f0;
        }
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 32px;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
