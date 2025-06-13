import React from "react";

export function FieldView({ title, children, tips }) {
    return (
        <div className="mb15">
            <div className="ui-flex-aj">
                <span className="fs12 b ">{title}</span>
                <div className="app-text-gray">{tips}</div>
            </div>
            <div className="ui-flex-a mt6">{children}</div>
        </div>
    );
}
