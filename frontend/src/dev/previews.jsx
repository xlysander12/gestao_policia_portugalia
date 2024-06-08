import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import OfficerList from "../App/components/OfficerList/officerlist";
import OfficerInfo from "../App/pages/OfficerInfo/officerinfo";
import {ModalSection} from "../App/components/Modal/modal";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/OfficerList">
                <OfficerList/>
            </ComponentPreview>
            <ComponentPreview path="/OfficerInfo">
                <OfficerInfo/>
            </ComponentPreview>
            <ComponentPreview path="/ModalSection">
                <ModalSection/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews