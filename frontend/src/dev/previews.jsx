import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import OfficerList from "../App/components/OfficerList/officerlist";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/OfficerList">
                <OfficerList/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews