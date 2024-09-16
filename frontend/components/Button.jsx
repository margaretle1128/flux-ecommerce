import { primary } from "@/lib/colors";
import styled, {css} from "styled-components";

export const ButtonStyle = css`
    border: 0;
    padding: 5px 15px;
    border-radius: 5px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    svg {
        height: 15px;
        margin-right: 5px;
    }
    ${props => props.block && css`
        display: block;
        width: 100%;
    `}
    ${props => props.size === 'l' && css`
        font-size: 1.1rem;
        padding: 10px 20px;
        svg {
            height: 18px;
        }
    `}
    ${props => props.primary && !props.outline && css`
        background-color: ${primary};
        color: white;
        border: 1px solid ${primary};
    `}
    ${props => props.primary && props.outline && css`
        background-color: transparent;
        color: ${primary};
        border: 1px solid ${primary};
    `}
    ${props => props.white && !props.outline && css`
        background-color: white;
        color: black;
    `}
    ${props => props.white && props.outline && css`
        background-color: transparent;
        color: white;
        border: 1px solid #fff;
    `}
    ${props => props.black && !props.outline && css`
        background-color: black;
        color: white;
    `}
    ${props => props.black && props.outline && css`
        background-color: transparent;
        color: black;
        border: 1px solid black;
    `}
`;

const StyledButton = styled.button`
    ${ButtonStyle}
`;

export default function Button({children,...rest}) {
    return (
        <StyledButton {...rest}>{children}</StyledButton>
    );
}