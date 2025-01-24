import React, { useEffect, useState } from "react";
import LogoSvg from "./LogoSvg"
import LogoutSvg from "./LogoutSvg"
import ShareSvg from "./ShareSvg"
import GridSvg from "./GridSvg"
import UserSvg from "./UserSvg"
import ImageSvg from "./ImageSvg"
import BankNoteSvg from "./BankNoteSvg"
import BuildingSvg from "./BuildingSvg"
import UsersSvg from "./UsersSvg"
import HomeSvg from "./HomeSvg"
import FileSvg from "./FileSvg"
import CalenderSvg from "./Calender";
import ReceiptSvg from "./ReceiptSvg";
import MailSvg from "./MailSvg"
import SettingsSvg from "./SettingsSvg"
import ArrowSvg from "./ArrowSvg"
import ChevronSvg from "./ChevronSvg"
import TrashSvg from "./TrashSvg"
import PencilSvg from "./PencilSvg"
import PlusSvg from "./PlusSvg"
import MinusSvg from "./MinusSvg"
import DotsSvg from "./DotsSvg"
import StarSvg from "./StarSvg"


const getIcon = (type, className, id, fill, onClick, onKeyUp, variant) => {
    const icons = {
        logo: <LogoSvg onClick={onClick} onKeyUp={onKeyUp} className={className} fill={fill} />,
        logout: <LogoutSvg onClick={onClick} onKeyUp={onKeyUp} className={className} />,
        pencil: <PencilSvg onClick={onClick} onKeyUp={onKeyUp} className={className} />,
        share: <ShareSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        grid: <GridSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        user: <UserSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        image: <ImageSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        banknote: <BankNoteSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        building: <BuildingSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        users: <UsersSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        home: <HomeSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        file: <FileSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        calender: <CalenderSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        receipt: <ReceiptSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        mail: <MailSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        settings: <SettingsSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        arrow: <ArrowSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        chevron: <ChevronSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        trash: <TrashSvg onClick={onClick} onKeyUp={onKeyUp} className={className} variant={variant} />,
        plus: <PlusSvg onClick={onClick} onKeyUp={onKeyUp} className={className}  />,
        minus: <MinusSvg onClick={onClick} onKeyUp={onKeyUp} className={className} />,
        dots: <DotsSvg onClick={onClick} onKeyUp={onKeyUp} className={className} />,
        star: <StarSvg onClick={onClick} onKeyUp={onKeyUp} className={className} />
    }

    return icons[type] || null;
}



const Icon = ({ className, id, fill = '', onClick, onKeyUp, type, variant }) => {
    const [icon, setIcon] = useState(null);

    useEffect(() => {
        if (type) {
            // Remove all white space from the string, with the regex
            const iconType = type.toLocaleLowerCase().replace(/\s+/g, '');

            // set the icon based on icon type change, useful for conditional icon renderings
            setIcon(getIcon(iconType, className, id, fill, onClick, onKeyUp, variant));
        }
    }, [type, className]);

    return icon;
};

export default Icon