interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
}

const ProfileModal = ({ isOpen, onClose, name, email, phoneNumber, role }: ProfileModalProps) => {
    if (!isOpen) return null;

    //#region Styles
    const modalStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const bgStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    };

    const contentStyle: React.CSSProperties = {
        position: 'relative',
        background: 'white',
        borderRadius: '10px',
        padding: '40px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '528px',
    };

    const headerStyle: React.CSSProperties = {
        marginBottom: '20px',
        position: 'relative',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 700,
        color: '#424547',
        letterSpacing: '0.02px',
        marginBottom: '10px',
    };

    const descStyle: React.CSSProperties = {
        fontSize: '12px',
        color: 'rgba(66, 69, 71, 0.8)',
        lineHeight: 1.5,
        marginBottom: '20px',
    };

    const closeStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '24px',
        height: '24px',
    };

    const closeButtonStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        padding: '0'
    };

    const bodyStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '20px',
    };

    const fieldStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '21px',
    };

    const fieldTitleStyle: React.CSSProperties = {
        fontSize: '15px',
        fontWeight: 400,
        color: '#424647',
        height: '18px'
    };

    const fieldValueStyle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: 600,
        color: '#424647',
    };

    const footerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
    };

    const footerButtonStyle: React.CSSProperties = {
        fontSize: '15px',
        fontWeight: 400,
        color: '#424647',
    };

    //#endregion


    return (
        <div style={modalStyle}>
            <div style={bgStyle} onClick={onClose}></div>
            <div style={contentStyle}>
                <div style={headerStyle}>
                    <div style={titleStyle}>
                        내 정보
                    </div>
                    <div style={descStyle}>
                        정보가 정확하지 않거나 다를 경우, 경영기획팀에 문의 바랍니다.
                    </div>
                    <div style={closeStyle}>
                        <button
                            style={closeButtonStyle}
                            onClick={onClose}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12.5008 13.4L7.60078 18.3C7.41745 18.4834 7.18411 18.575 6.90078 18.575C6.61745 18.575 6.38411 18.4834 6.20078 18.3C6.01745 18.1167 5.92578 17.8834 5.92578 17.6C5.92578 17.3167 6.01745 17.0834 6.20078 16.9L11.1008 12L6.20078 7.10005C6.01745 6.91672 5.92578 6.68338 5.92578 6.40005C5.92578 6.11672 6.01745 5.88338 6.20078 5.70005C6.38411 5.51672 6.61745 5.42505 6.90078 5.42505C7.18411 5.42505 7.41745 5.51672 7.60078 5.70005L12.5008 10.6L17.4008 5.70005C17.5841 5.51672 17.8174 5.42505 18.1008 5.42505C18.3841 5.42505 18.6174 5.51672 18.8008 5.70005C18.9841 5.88338 19.0758 6.11672 19.0758 6.40005C19.0758 6.68338 18.9841 6.91672 18.8008 7.10005L13.9008 12L18.8008 16.9C18.9841 17.0834 19.0758 17.3167 19.0758 17.6C19.0758 17.8834 18.9841 18.1167 18.8008 18.3C18.6174 18.4834 18.3841 18.575 18.1008 18.575C17.8174 18.575 17.5841 18.4834 17.4008 18.3L12.5008 13.4Z" fill="#1F1F1F" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div style={bodyStyle}>
                    <div style={fieldStyle}>
                        <div style={fieldTitleStyle}>이름</div>
                        <div style={fieldValueStyle}>{name}</div>
                    </div>
                    <div style={fieldStyle}>
                        <div style={fieldTitleStyle}>이메일</div>
                        <div style={fieldValueStyle}>{email}</div>
                    </div>
                    <div style={fieldStyle}>
                        <div style={fieldTitleStyle}>연락처</div>
                        <div style={fieldValueStyle}>{phoneNumber}</div>
                    </div>
                    <div style={fieldStyle}>
                        <div style={fieldTitleStyle}>담당/직무</div>
                        <div style={fieldValueStyle}>{role}</div>
                    </div>
                </div>
                <div style={footerStyle}>
                    <button style={footerButtonStyle}>
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;